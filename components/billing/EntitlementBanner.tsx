"use client";
import type { ComponentType } from "react";
import Link from "next/link";
import { FiAlertCircle, FiArrowUpRight, FiClock, FiZap } from "react-icons/fi";
import { useEntitlements } from "../../hooks/useEntitlements";

type BannerIconProps = { size?: number; "aria-hidden"?: boolean };
const AlertCircleIcon = FiAlertCircle as ComponentType<BannerIconProps>;
const ArrowUpRightIcon = FiArrowUpRight as ComponentType<BannerIconProps>;
const ClockIcon = FiClock as ComponentType<BannerIconProps>;
const ZapIcon = FiZap as ComponentType<BannerIconProps>;

export default function EntitlementBanner() {
  const { entitlements, isLoading } = useEntitlements();
  if (isLoading || !entitlements) return null;
  if (entitlements.access_active && !entitlements.cancel_at_period_end && entitlements.status !== "past_due") return null;
  if (!entitlements.access_active) {
    return (
      <div className="entitlement-banner mb-3" role="status">
        <span className="entitlement-banner-mark" aria-hidden="true"><ZapIcon size={17} /></span>
        <div className="entitlement-banner-copy">
          <span className="settings-eyebrow mb-0">Keep your workflow moving</span>
          <strong className="entitlement-banner-title">Unlock hosted CommitDiary features</strong>
          <p className="entitlement-banner-text">An active plan keeps sync, history, AI reports, Discord delivery, and sharing available.</p>
        </div>
        <Link href="/pages/settings" className="btn btn-primary btn-sm entitlement-banner-action">View plans <ArrowUpRightIcon size={15} /></Link>
      </div>
    );
  }
  if (entitlements.status === "past_due" && entitlements.grace_period_end) {
    return (
      <div className="entitlement-banner entitlement-banner-danger mb-3" role="alert">
        <span className="entitlement-banner-mark" aria-hidden="true"><AlertCircleIcon size={17} /></span>
        <div className="entitlement-banner-copy">
          <span className="settings-eyebrow mb-0">Payment needs your attention</span>
          <strong className="entitlement-banner-title">Update your payment method</strong>
          <p className="entitlement-banner-text">We couldn’t confirm your latest payment. Update it by {new Date(entitlements.grace_period_end).toLocaleDateString()} to keep hosted access.</p>
        </div>
        <Link href="/pages/settings" className="btn btn-primary btn-sm entitlement-banner-action">Manage billing <ArrowUpRightIcon size={15} /></Link>
      </div>
    );
  }
  if (entitlements.cancel_at_period_end) {
    return (
      <div className="entitlement-banner entitlement-banner-info mb-3" role="status">
        <span className="entitlement-banner-mark" aria-hidden="true"><ClockIcon size={17} /></span>
        <div className="entitlement-banner-copy">
          <strong className="entitlement-banner-title">Cancellation scheduled</strong>
          <p className="entitlement-banner-text">You keep access until {entitlements.current_period_end ? new Date(entitlements.current_period_end).toLocaleDateString() : "the end of your current period"}.</p>
        </div>
      </div>
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
      <div className="entitlement-banner mt-3" role="status">
        <span className="entitlement-banner-mark" aria-hidden="true"><ZapIcon size={17} /></span>
        <div className="entitlement-banner-copy">
          <strong className="entitlement-banner-title">This feature needs an active plan</strong>
          <p className="entitlement-banner-text">{feature} requires {feature === "exports" || feature === "backfill" ? "Pro" : "a paid plan"}.</p>
        </div>
        <Link href="/pages/settings" className="btn btn-primary btn-sm entitlement-banner-action">See plans <ArrowUpRightIcon size={15} /></Link>
      </div>
    );
  }
  if (!entitlements.access_active) {
    return fallback ?? (
      <div className="entitlement-banner mt-3" role="status">
        <span className="entitlement-banner-mark" aria-hidden="true"><ZapIcon size={17} /></span>
        <div className="entitlement-banner-copy">
          <strong className="entitlement-banner-title">Hosted access is inactive</strong>
          <p className="entitlement-banner-text">Choose a plan to enable this feature.</p>
        </div>
        <Link href="/pages/settings" className="btn btn-primary btn-sm entitlement-banner-action">Choose a plan <ArrowUpRightIcon size={15} /></Link>
      </div>
    );
  }
  return <>{children}</>;
}
