"use client";
import { useEffect, useState, type ComponentType } from "react";
import { Card, Button, Alert, Badge, ProgressBar } from "react-bootstrap";
import Link from "next/link";
import { FiArrowUpRight, FiCreditCard } from "react-icons/fi";
import { createCheckout, createBillingPortal } from "../../lib/apiClient";
import { useEntitlements } from "../../hooks/useEntitlements";
import { useBillingCatalog } from "../../hooks/useBillingCatalog";

type BillingIconProps = { size?: number; "aria-hidden"?: boolean };
const ArrowUpRightIcon = FiArrowUpRight as ComponentType<BillingIconProps>;
const CreditCardIcon = FiCreditCard as ComponentType<BillingIconProps>;

type BillingCadence = "monthly" | "annual";

function getBillingActionError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message && error.message.length <= 240) return error.message;
  return fallback;
}

export default function BillingSettings() {
  const { entitlements, error: entitlementError, isLoading, refresh } = useEntitlements();
  const { catalog, error: catalogError, isLoading: isCatalogLoading } = useBillingCatalog();
  const [error, setError] = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [cadence, setCadence] = useState<BillingCadence>("monthly");

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh().catch(() => undefined);
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  async function handleCheckout(plan_code: string, selectedCadence: BillingCadence = "monthly") {
    try {
      setActionLoading(plan_code);
      setError(null);
      const requestKey = globalThis.crypto.randomUUID();
      const { url } = await createCheckout(plan_code, selectedCadence, requestKey);
      window.location.href = url;
    } catch (error: unknown) {
      setError(getBillingActionError(error, "Could not start checkout. Try again shortly."));
      setActionLoading(null);
    }
  }
  async function handlePortal() {
    try {
      setActionLoading("portal");
      setError(null);
      const { url } = await createBillingPortal();
      window.location.href = url;
    } catch (error: unknown) {
      setError(getBillingActionError(error, "Billing portal unavailable. Try again shortly."));
      setActionLoading(null);
    }
  }
  const displayError = error || entitlementError?.message || catalogError?.message;
  if (isLoading) return <Card><Card.Body>Loading billing...</Card.Body></Card>;
  if (!entitlements) return <Alert variant="danger">{displayError||'No billing data'}</Alert>;
  const usagePct = entitlements.limits.ai_reports ? Math.round((entitlements.usage.ai_reports_reserved / entitlements.limits.ai_reports)*100) : 0;
  const isActive = entitlements.access_active;
  const planOptions = catalog?.plans.filter((plan) => plan.code !== "local") ?? [];
  return (
    <Card className="border shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <div><h5 className="mb-0">Billing & Plan</h5><small className="text-muted">Manage your CommitDiary subscription</small></div>
        <Badge bg={isActive?'success': entitlements.status==='past_due'?'warning':'secondary'}>{entitlements.plan_name} — {entitlements.status}</Badge>
      </Card.Header>
      <Card.Body>
        {displayError && <Alert variant="danger" dismissible onClose={()=>setError(null)}>{displayError}</Alert>}
        {!isActive && <div className="billing-upgrade-card" role="status">
          <span className="billing-upgrade-icon" aria-hidden="true"><CreditCardIcon size={17} /></span>
          <div className="billing-upgrade-copy">
            <strong>Choose the plan that fits your workflow</strong>
            <p>Activate hosted sync, history, AI reports, Discord delivery, and sharing with a paid plan.</p>
          </div>
          <Link href="/pricing" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1">Compare plans <ArrowUpRightIcon size={15} /></Link>
        </div>}
        {entitlements.cancel_at_period_end && <Alert variant="info">Your subscription will not renew. Access remains until {entitlements.current_period_end ? new Date(entitlements.current_period_end).toLocaleDateString() : 'period end'}.</Alert>}
        {entitlements.grace_period_end && entitlements.status==='past_due' && <Alert variant="warning">Payment failed. Grace period until {new Date(entitlements.grace_period_end).toLocaleDateString()}. Update payment to keep access.</Alert>}

        <div className="mb-3">
          <strong>Usage this period (from {entitlements.usage_period_start})</strong>
          <div className="d-flex justify-content-between"><small>AI reports: {entitlements.usage.ai_reports_reserved} / {entitlements.limits.ai_reports || '—'}</small><small>{usagePct}%</small></div>
          <ProgressBar now={Math.min(usagePct,100)} variant={usagePct>90?'danger':usagePct>70?'warning':'primary'} style={{height:'8px'}} />
          <small className="text-muted">Synced commits: {entitlements.usage.synced_commits} · Discord deliveries: {entitlements.usage.discord_deliveries}</small>
        </div>
        <div className="mb-3">
          <small className="text-muted">Limits: {entitlements.limits.repositories} repos · {entitlements.limits.ai_reports} AI reports/month · {entitlements.limits.discord_webhooks} webhook(s) · {entitlements.limits.hosted_history_days ? `${entitlements.limits.hosted_history_days}d history` : 'unlimited history'}</small>
          {entitlements.current_period_end && <div><small>Next billing: {new Date(entitlements.current_period_end).toLocaleDateString()}</small></div>}
        </div>
        {!isActive && <fieldset className="mb-3">
          <legend className="h6 mb-2">Billing frequency</legend>
          <div className="d-flex gap-2" role="group" aria-label="Billing frequency">
            <Button type="button" size="sm" variant={cadence === "monthly" ? "primary" : "outline-secondary"} aria-pressed={cadence === "monthly"} onClick={() => setCadence("monthly")}>Monthly</Button>
            <Button type="button" size="sm" variant={cadence === "annual" ? "primary" : "outline-secondary"} aria-pressed={cadence === "annual"} onClick={() => setCadence("annual")}>Annual</Button>
          </div>
        </fieldset>}
        <div className="d-flex gap-2 flex-wrap">
          {!isActive && isCatalogLoading && <small className="text-muted align-self-center">Loading current plans…</small>}
          {!isActive && !isCatalogLoading && planOptions.map((plan, index) => {
            const price = plan.prices?.[cadence];
            const variant = index === 0 ? "primary" : index === 1 ? "outline-primary" : "outline-secondary";
            return <Button key={plan.code} variant={variant} disabled={!!actionLoading || !price} onClick={() => handleCheckout(plan.code, cadence)}>{actionLoading === plan.code ? 'Starting checkout…' : `Get ${plan.name} ${price?.formatted_total || 'unavailable'}${price ? cadence === "annual" ? '/year' : '/month' : ''}`}</Button>;
          })}
          {!isActive && !isCatalogLoading && planOptions.length === 0 && <small className="text-danger">No paid plans are currently available.</small>}
          {isActive && <Button variant="outline-primary" disabled={!!actionLoading} onClick={handlePortal}>{actionLoading==='portal'?'...':'Manage billing'}</Button>}
          <Button variant="link" onClick={() => { setError(null); void refresh().catch(() => undefined); }}>Refresh</Button>
        </div>
        <small className="d-block mt-3 text-muted">
          Paid plans are sold through Paddle. Review the <Link href="/terms">Terms</Link> and <Link href="/refunds">Refund Policy</Link> before checkout; Paddle shows the final tax, renewal, and total details.
        </small>
      </Card.Body>
    </Card>
  );
}
