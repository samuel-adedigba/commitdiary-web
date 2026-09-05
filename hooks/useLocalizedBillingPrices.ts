"use client";

import { useMemo } from "react";
import { useApiResource } from "./useApiResource";
import type { BillingCatalog } from "../lib/apiClient";

type BillingCadence = "monthly" | "annual";

type PaddlePreviewLineItem = {
  price?: { id?: unknown };
  formattedTotals?: { total?: unknown };
};

type PaddlePreviewResponse = {
  data?: { details?: { lineItems?: PaddlePreviewLineItem[] } };
};

type PaddleClient = {
  Environment?: { set: (environment: "sandbox" | "production") => void };
  Initialize: (options: { token: string }) => void;
  Checkout?: { open: (request: { transactionId: string }) => void };
  PricePreview: (request: { items: Array<{ priceId: string; quantity: number }> }) => Promise<PaddlePreviewResponse>;
};

declare global {
  interface Window {
    Paddle?: PaddleClient;
  }
}

const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";
const paddleClientToken = String(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "").trim();
const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
  ? "production"
  : "sandbox";

let paddlePromise: Promise<PaddleClient> | null = null;

export function loadPaddleClient(): Promise<PaddleClient> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paddle pricing is only available in a browser."));
  }

  if (window.Paddle?.PricePreview) return Promise.resolve(window.Paddle);
  if (paddlePromise) return paddlePromise;

  paddlePromise = new Promise<PaddleClient>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-commitdiary-paddle]");
    const script = existingScript || document.createElement("script");

    const initialize = () => {
      try {
        if (!window.Paddle?.PricePreview) throw new Error("Paddle.js did not load correctly.");
        window.Paddle.Environment?.set(paddleEnvironment);
        window.Paddle.Initialize({ token: paddleClientToken });
        resolve(window.Paddle);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Paddle.js could not be initialized."));
      }
    };

    script.addEventListener("load", initialize, { once: true });
    script.addEventListener("error", () => reject(new Error("Paddle.js could not be loaded.")), { once: true });

    if (!existingScript) {
      script.src = PADDLE_SCRIPT_URL;
      script.async = true;
      script.dataset.commitdiaryPaddle = "true";
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    paddlePromise = null;
    throw error;
  });

  return paddlePromise;
}

export function extractLocalizedPrices(result: PaddlePreviewResponse): Record<string, string> {
  const localizedPrices: Record<string, string> = {};
  const lineItems = result?.data?.details?.lineItems;

  if (!Array.isArray(lineItems)) return localizedPrices;

  for (const item of lineItems) {
    const priceId = typeof item?.price?.id === "string" ? item.price.id : "";
    const total = typeof item?.formattedTotals?.total === "string"
      ? item.formattedTotals.total
      : "";
    if (priceId && total) localizedPrices[priceId] = total;
  }

  return localizedPrices;
}

async function previewLocalizedPrices(items: Array<{ priceId: string; quantity: number }>): Promise<Record<string, string>> {
  // A missing or mismatched client token must leave the page usable without exposing a secret or inventing FX.
  const expectedPrefix = paddleEnvironment === "production" ? "live_" : "test_";
  if (!paddleClientToken || !paddleClientToken.startsWith(expectedPrefix) || items.length === 0) return {};

  const paddle = await loadPaddleClient();
  const result = await paddle.PricePreview({ items });
  return extractLocalizedPrices(result);
}

function previewItems(catalog: BillingCatalog | null, cadence: BillingCadence) {
  if (!catalog) return [];

  return catalog.plans
    .map((plan) => plan.prices?.[cadence])
    .filter((price): price is NonNullable<typeof price> => Boolean(price?.price_id))
    .map((price) => ({ priceId: price.price_id, quantity: 1 }));
}

export function useLocalizedBillingPrices(catalog: BillingCatalog | null, cadence: BillingCadence) {
  const items = useMemo(() => previewItems(catalog, cadence), [catalog, cadence]);
  const itemKey = items.map((item) => item.priceId).join(",") || "none";
  const resource = useApiResource<Record<string, string>>(
    `paddle-price-preview:${cadence}:${itemKey}`,
    () => previewLocalizedPrices(items),
  );

  return {
    localizedPrices: resource.data || {},
    ...resource,
  };
}
