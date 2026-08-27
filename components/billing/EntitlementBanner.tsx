"use client";
import { Alert, Button } from "react-bootstrap";
import Link from "next/link";
import { useEntitlements } from "../../hooks/useEntitlements";

export default function EntitlementBanner() {
  const { entitlements, isLoading } = useEntitlements();
  if (isLoading || !entitlements) return null;
  if (entitlements.access_active && !entitlements.cancel_at_period_end && entitlements.status !== "past_due") return null;
  if (!entitlements.access_active) {
    return (
      <Alert variant="warning" className="mb-3 d-flex justify-content-between align-items-center">
        <div><strong>Upgrade required</strong> — Your plan is {entitlements.status}. Hosted sync, dashboard history, AI reports, Discord and sharing require an active subscription.</div>
        <Link href="/pages/settings" className="btn btn-warning btn-sm ms-3">View plans</Link>
      </Alert>
    );
  }
  if (entitlements.status === "past_due" && entitlements.grace_period_end) {
    return (
      <Alert variant="danger" className="mb-3 d-flex justify-content-between align-items-center">
        <div><strong>Payment failed</strong> — Grace until {new Date(entitlements.grace_period_end).toLocaleDateString()}. Update payment to avoid losing hosted access.</div>
        <Link href="/pages/settings" className="btn btn-danger btn-sm ms-3">Manage billing</Link>
      </Alert>
    );
  }
  if (entitlements.cancel_at_period_end) {
    return (
      <Alert variant="info" className="mb-3"><strong>Cancellation scheduled</strong> — You keep access until {entitlements.current_period_end ? new Date(entitlements.current_period_end).toLocaleDateString() : "period end"}.</Alert>
    );
  }
  return null;
}

export function EntitlementGuard({ feature, children, fallback }: { feature?: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { entitlements, isLoading } = useEntitlements();
  if (isLoading) return null;
  if (!entitlements) return <>{children}</>;
  if (feature && !entitlements.features.includes(feature)) {
    return fallback ?? (
      <Alert variant="warning" className="mt-3">
        <strong>Paid feature</strong> — {feature} requires {feature === "exports" || feature === "backfill" ? "Pro" : "a paid plan"}. <Link href="/pages/settings">Upgrade</Link> to unlock.
      </Alert>
    );
  }
  if (!entitlements.access_active) {
    return fallback ?? (
      <Alert variant="warning" className="mt-3">Hosted access inactive — <Link href="/pages/settings">Choose a plan</Link> to enable this feature.</Alert>
    );
  }
  return <>{children}</>;
}
