"use client";

import Link from "next/link";
import { useState } from "react";
import { useBillingCatalog } from "../../hooks/useBillingCatalog";
import styles from "./landing.module.scss";

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function planPrice(plan, cadence) {
  const price = plan.prices?.[cadence];
  if (price?.formatted_total) return price.formatted_total;
  if (plan.code === "local") return "$0";
  return "Price unavailable";
}

function planCadence(plan, cadence) {
  if (plan.code === "local") return "forever";
  return cadence === "annual" ? "per year" : "per month";
}

export default function PricingSection() {
  const { catalog, error, isLoading, refresh } = useBillingCatalog();
  const [cadence, setCadence] = useState("monthly");

  if (isLoading && !catalog) {
    return (
      <section id="pricing" className={styles.accessSection} aria-labelledby="access-title" aria-busy="true">
        <div className={styles.accessCopy}>
          <p className={styles.eyebrow}>Pricing</p>
          <h2 id="access-title">Loading current plans…</h2>
          <p>We’re checking the current CommitDiary catalog.</p>
        </div>
      </section>
    );
  }

  if (!catalog) {
    return (
      <section id="pricing" className={styles.accessSection} aria-labelledby="access-title">
        <div className={styles.accessCopy}>
          <p className={styles.eyebrow}>Pricing</p>
          <h2 id="access-title">Pricing is temporarily unavailable.</h2>
          <p role="alert">{error?.message || "We could not load the current Paddle catalog."}</p>
          <button type="button" className={styles.secondaryButton} onClick={() => void refresh().catch(() => undefined)}>
            Try again <ArrowIcon />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className={styles.accessSection} aria-labelledby="access-title">
      <div className={styles.accessCopy}>
        <p className={styles.eyebrow}>Start with your next commit</p>
        <h2 id="access-title">The extension is the front door.</h2>
        <p>
          Install CommitDiary in VS Code, create your account, securely add your API key through the setup command, and let your work journal build from there.
        </p>
      </div>
      <div className="mb-4 d-flex gap-2" role="group" aria-label="Billing frequency">
        {(["monthly", "annual"]).map((option) => (
          <button
            key={option}
            type="button"
            className={option === cadence ? styles.primaryButton : styles.secondaryButton}
            aria-pressed={option === cadence}
            onClick={() => setCadence(option)}
          >
            {option === "monthly" ? "Monthly" : "Annual — 10 months’ price"}
          </button>
        ))}
      </div>
      <div className={styles.pricingGrid}>
        {catalog.plans.map((plan) => {
          const price = plan.prices?.[cadence];
          return (
            <article key={plan.code} className={`${styles.pricingCard} ${plan.featured ? styles.pricingCardFeatured : ""}`}>
              <div className={styles.pricingCardHeader}>
                <span>{plan.marketing_label}</span>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>
              <div className={styles.price}>
                <strong>{planPrice(plan, cadence)}</strong>
                <span>{planCadence(plan, cadence)}</span>
              </div>
              <ul>
                {plan.display_features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
              </ul>
              <Link href={plan.code === "local" ? "/install" : "/pricing"} className={plan.featured ? styles.primaryButton : styles.secondaryButton}>
                {plan.cta_label} <ArrowIcon />
              </Link>
              {plan.code !== "local" && !price && <small>This plan is not currently available for checkout.</small>}
            </article>
          );
        })}
      </div>
      <p className={styles.pricingNote}>Paid plans are billed through Paddle. Final currency and tax details are shown during checkout.</p>
    </section>
  );
}
