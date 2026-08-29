"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createCheckout } from "lib/apiClient";
import { useAuth } from "lib/auth-context";
import { useBillingCatalog } from "../../hooks/useBillingCatalog";

const PLAN_NAMES = {
  founding_solo: "Founding Solo",
  solo: "Solo",
  pro: "Pro",
};

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
  const plan = catalog?.plans.find((item) => item.code === planCode);
  const planName = PLAN_NAMES[planCode] || "Selected plan";
  const next = `/checkout?plan_code=${encodeURIComponent(planCode)}&cadence=${cadence}`;

  async function startCheckout() {
    try {
      setStarting(true);
      setError("");
      const requestKey = globalThis.crypto.randomUUID();
      const result = await createCheckout(planCode, cadence, requestKey);
      const checkoutUrl = new URL(result.url);
      if (checkoutUrl.protocol !== "https:" || !(checkoutUrl.hostname === "paddle.com" || checkoutUrl.hostname.endsWith(".paddle.com"))) {
        throw new Error("Checkout destination is not trusted.");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not start checkout. Try again shortly.");
      setStarting(false);
    }
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
        <h1 className="h2">Continue with {planName}</h1>
        <p className="text-muted">Sign in or create your CommitDiary account before we open Paddle checkout.</p>
        <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(next)}`}>Sign in to continue</Link>
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
