"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "/lib/apiClient";
import { useApiResource } from "/hooks/useApiResource";

const FULL_PAGE_SIZES = [10, 20, 50];

function getPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function usePublicShare(
  username: string,
  token: string,
  variant: "full" | "embed",
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedLimit = getPositiveInteger(searchParams.get("limit"), 20);
  const limit = variant === "embed"
    ? 10
    : FULL_PAGE_SIZES.includes(requestedLimit) ? requestedLimit : 20;
  const page = variant === "embed" ? 1 : getPositiveInteger(searchParams.get("page"), 1);
  const repo = searchParams.get("repo")?.trim() || undefined;
  const resourceKey = `public-share:${username}:${token}:${page}:${limit}:${repo || "first"}`;
  const resource = useApiResource(resourceKey, () =>
    apiClient.getPublicShare(username, token, { page, limit, repo }),
  );

  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") query.delete(key);
      else query.set(key, String(value));
    });
    const queryString = query.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const errorCode = resource.error && "code" in resource.error
    ? String(resource.error.code)
    : undefined;
  const recover = () => {
    switch (errorCode) {
      case "PAGE_OUT_OF_RANGE":
        updateQuery({ page: 1 });
        break;
      case "SHARE_REPOSITORY_NOT_FOUND":
        updateQuery({ repo: undefined, page: 1 });
        break;
      default:
        void resource.refresh().catch(() => undefined);
    }
  };

  return {
    ...resource,
    recover,
    recoveryLabel: errorCode === "PAGE_OUT_OF_RANGE"
      ? "Return to first page"
      : errorCode === "SHARE_REPOSITORY_NOT_FOUND"
        ? "View available repositories"
        : "Try again",
    onRepositoryChange: (repoName: string) => updateQuery({ repo: repoName, page: 1 }),
    onPageChange: (nextPage: number) => updateQuery({ page: nextPage }),
    onPageSizeChange: (nextLimit: number) => updateQuery({ limit: nextLimit, page: 1 }),
  };
}
