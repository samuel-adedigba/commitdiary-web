"use client";

import { useApiResource } from "./useApiResource";
import { getBillingCatalog, type BillingCatalog } from "../lib/apiClient";

export function useBillingCatalog() {
  const resource = useApiResource<BillingCatalog>("billing-catalog", getBillingCatalog);
  return { catalog: resource.data, ...resource };
}
