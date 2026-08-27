"use client";
import { useApiResource } from "./useApiResource";
import { getEntitlements, type Entitlements } from "../lib/apiClient";
export function useEntitlements() {
  const { data, error, status, isLoading, refresh } = useApiResource<Entitlements>("entitlements", getEntitlements);
  return { entitlements: data, error, status, isLoading, refresh, hasAccess: data?.access_active ?? false };
}
