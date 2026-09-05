"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createCheckout, getEntitlements } from "lib/apiClient";
import { useAuth } from "lib/auth-context";
import { useBillingCatalog } from "../../hooks/useBillingCatalog";
import { loadPaddleClient } from "../../hooks/useLocalizedBillingPrices";

const PLAN_NAMES = {
  founding_solo: "Founding Solo",
  solo: "Solo",
  pro: "Pro",
};

// How the _ptxn view validates payment before redirecting. The API is the source
// of truth: access flips only after Paddle's webhook (production) or the billing
// recovery sync (local dev, ~60s cycle) provisions the subscription. Polling the
// entitlement — not the Paddle overlay state — gates the dashboard redirect.
const ENTITLEMENT_POLL_INTERVAL_MS = 5000;
const ENTITLEMENT_POLL_MAX_ATTEMPTS = 60;
const SUCCESS_REDIRECT_DELAY_MS = 1800;

function isEntitledForPlan(entitlements, planCode) {
  if (!entitlements?.access_active) return false;
  if (!planCode) return true;
  return entitlements.plan === planCode;
}

function validCadence(value) {
  return value === "annual" ? "annual" : "monthly";
}

function CheckoutStartPageContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { catalog, isLoading: catalogLoading } = useBillingCatalog();
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const planCode = searchParams.get("plan_code") || "";
  const cadence = validCadence(searchParams.get("cadence"));
  const transactionId = searchParams.get("_ptxn") || "";
  const plan = catalog?.plans.find((item) => item.code === planCode);
  const planName = PLAN_NAMES[planCode] || "Selected plan";
  const next = `/checkout?plan_code=${encodeURIComponent(planCode)}&cadence=${cadence}`;
  // _ptxn view phases: confirming (overlay open + polling entitlements)
  // → active (paid, redirecting) → expired (poll timed out, payment still pending)
  const [phase, setPhase] = useState(transactionId ? "confirming" : "review");

  const redirectToDashboard = () => {
    window.setTimeout(() => {
      window.location.assign("/dashboard");
    }, SUCCESS_REDIRECT_DELAY_MS);
  };

  useEffect(() => {
    if (!transactionId) return undefined;

    let cancelled = false;
    let attempts = 0;
    let intervalId = 0;
    setPhase("confirming");

    const stopPolling = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = 0;
      }
    };

    // Single entitlement check. Resolves true when the API confirms access,
    // which is what validates the dashboard redirect.
    const checkEntitlements = async () => {
      try {
        const entitlements = await getEntitlements();
        if (cancelled) return false;
        if (isEntitledForPlan(entitlements, planCode)) {
          stopPolling();
          setPhase("active");
          redirectToDashboard();
          return true;
        }
      } catch {
        // Transient (network/auth hiccup) — keep polling until the cap.
      }
      return false;
    };

    const poll = async () => {
      attempts += 1;
      const confirmed = await checkEntitlements();
      if (confirmed || cancelled) return;
      if (attempts >= ENTITLEMENT_POLL_MAX_ATTEMPTS) {
        stopPolling();
        setPhase("expired");
      }
    };

    // Already paid (reopened link, retry after success) → skip the overlay entirely.
    checkEntitlements().then((confirmed) => {
      if (cancelled || confirmed) return;
      loadPaddleClient()
        .then((paddle) => {
          if (cancelled || typeof paddle.Checkout?.open !== "function") return;
          paddle.Checkout.open({ transactionId });
          intervalId = window.setInterval(poll, ENTITLEMENT_POLL_INTERVAL_MS);
        })
        .catch((checkoutError) => {
          if (!cancelled) {
            setError(checkoutError instanceof Error ? checkoutError.message : "Paddle checkout could not be opened.");
          }
        });
    });

    // Overlay dismissal returns focus to this tab — revalidate immediately.
    const handleFocus = () => {
      if (!cancelled) void checkEntitlements();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      stopPolling();
      window.removeEventListener("focus", handleFocus);
    };
  }, [transactionId, planCode]);

  async function startCheckout() {
    try {
      setStarting(true);
      setError("");
      const requestKey = globalThis.crypto.randomUUID();
      const result = await createCheckout(planCode, cadence, requestKey);
      if (!result.url) {
        window.location.assign(`/checkout?plan_code=${encodeURIComponent(planCode)}&cadence=${cadence}&_ptxn=${encodeURIComponent(result.transactionId)}`);
        return;
      }
      const checkoutUrl = new URL(result.url);
      const isPaddleUrl = checkoutUrl.protocol === "https:" && (checkoutUrl.hostname === "paddle.com" || checkoutUrl.hostname.endsWith(".paddle.com"));
      // Paddle echoes the account's configured checkout domain. In local dev that is
      // the https loopback URL while `next dev` serves http — same host+port, different
      // scheme. Navigate relatively to stay on the tab's origin instead of trusting
      // a scheme-blind cross-origin redirect.
      const isLoopbackHost = checkoutUrl.hostname === "localhost" || checkoutUrl.hostname === "127.0.0.1";
      const isSameLoopbackTarget =
        isLoopbackHost &&
        checkoutUrl.hostname === window.location.hostname &&
        checkoutUrl.port === window.location.port;
      if (isPaddleUrl || checkoutUrl.origin === window.location.origin) {
        window.location.assign(checkoutUrl.toString());
      } else if (isSameLoopbackTarget) {
        window.location.assign(`${checkoutUrl.pathname}${checkoutUrl.search}${checkoutUrl.hash}`);
      } else {
        throw new Error("Checkout destination is not trusted.");
      }
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not start checkout. Try again shortly.");
      setStarting(false);
    }
  }

  if (transactionId) {
    if (phase === "active") {
      return (
        <main className="container py-5" aria-busy="true" aria-labelledby="checkout-title">
          <h1 id="checkout-title" className="h2">Payment confirmed</h1>
          <p className="text-muted">{planName} is now active on your account. Taking you to your dashboard…</p>
        </main>
      );
    }
    if (phase === "expired") {
      return (
        <main className="container py-5" aria-labelledby="checkout-title">
          <h1 id="checkout-title" className="h2">Payment still being confirmed</h1>
          <p className="text-muted">
            Paddle has your payment — access appears automatically once billing sync completes.
            This can take a minute in sandbox while the recovery sync runs.
          </p>
          {error && <p className="alert alert-danger" role="alert">{error}</p>}
          <div className="d-flex flex-wrap align-items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Check again</button>
            <Link className="btn btn-link px-0" href={next}>Start a new checkout</Link>
            <Link className="btn btn-link px-0" href="/dashboard">Back to dashboard</Link>
          </div>
        </main>
      );
    }
    return (
      <main className="container py-5" aria-busy="true" aria-labelledby="checkout-title">
        <h1 id="checkout-title" className="h2">Opening secure checkout…</h1>
        {error ? <p className="alert alert-danger" role="alert">{error}</p> : <p className="text-muted">Paddle checkout is loading. Keep this tab open — you will be redirected to your dashboard once payment is confirmed.</p>}
      </main>
    );
  }

  if (!PLAN_NAMES[planCode]) {
    return <main className="container py-5"><h1 className="h2">Choose a valid plan</h1><p className="text-muted">Return to pricing and select an available plan.</p><Link className="btn btn-primary" href="/#pricing">View plans</Link></main>;
  }

  if (authLoading || catalogLoading) {
    return <main className="container py-5" aria-busy="true"><h1 className="h2">Preparing secure checkout…</h1><p className="text-muted">Checking your account and the current plan price.</p></main>;
  }

  if (!user) {
    return (
      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <section className="card border-0 shadow-sm" aria-labelledby="checkout-title">
              <div className="card-body p-4 p-md-5">
                <p className="text-uppercase text-muted small fw-semibold mb-2">Secure checkout</p>
                <h1 id="checkout-title" className="h2 mb-3">Continue with {planName}</h1>
                <p className="text-muted mb-4">
                  Sign in or create your CommitDiary account before we open Paddle checkout. Your final currency, tax, renewal, and total are shown before payment.
                </p>
                <div className="border rounded p-3 mb-4 bg-light">
                  <div className="d-flex justify-content-between gap-3">
                    <span className="fw-semibold">{planName}</span>
                    <span className="text-muted">{cadence === "annual" ? "Annual billing" : "Monthly billing"}</span>
                  </div>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(next)}`}>Sign in to continue</Link>
                  <Link className="btn btn-link px-0" href="/#pricing">Back to plans</Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const price = plan?.prices?.[cadence];
  return (
    <main className="container py-5" aria-labelledby="checkout-title">
      <h1 id="checkout-title" className="h2">Review your plan</h1>
      <p className="text-muted">{plan?.name || planName} · {cadence === "annual" ? "Annual billing" : "Monthly billing"}</p>
      <p>Continue to Paddle to review the final currency, tax, renewal, and total before paying.</p>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <button type="button" className="btn btn-primary" onClick={startCheckout} disabled={starting || !price}>
        {starting ? "Opening secure checkout…" : price ? "Continue to Paddle" : "This price is unavailable"}
      </button>{" "}
      <Link className="btn btn-link" href="/#pricing">Back to plans</Link>
    </main>
  );
}

function CheckoutLoading() {
  return <main className="container py-5" aria-busy="true"><h1 className="h2">Preparing secure checkout…</h1><p className="text-muted">Checking your account and the current plan price.</p></main>;
}

export default function CheckoutStartPage() {
  return <Suspense fallback={<CheckoutLoading />}><CheckoutStartPageContent /></Suspense>;
}
