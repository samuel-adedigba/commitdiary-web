const MARKETING_PATHS = new Set([
  "/",
  "/badge",
  "/discord",
  "/docs",
  "/features",
  "/github",
  "/how-it-works",
  "/install",
  "/marketplace",
  "/pricing",
  "/privacy",
  "/templates",
]);

const PRODUCT_PATH_PREFIXES = [
  "/api/auth",
  "/authentication",
  "/changelog",
  "/commits",
  "/dashboard",
  "/documentation",
  "/pages",
  "/repositories",
  "/s",
  "/shares",
  "/v1",
];

type DomainRoutingConfig = {
  marketingUrl: string;
  appUrl: string;
};

export type DomainRoute =
  | { action: "next" }
  | { action: "redirect"; url: URL }
  | { action: "rewrite"; pathname: string };

function readOrigin(value: string, name: string): URL | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return url;
  } catch {
    throw new Error(`${name} must be a credential-free HTTP(S) origin.`);
  }
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function redirectTo(origin: URL, requestUrl: URL): URL {
  const destination = new URL(requestUrl.pathname + requestUrl.search, origin);
  destination.hash = requestUrl.hash;
  return destination;
}

export function resolveDomainRoute(
  requestUrl: URL,
  requestHost: string,
  config: DomainRoutingConfig,
): DomainRoute {
  const marketingOrigin = readOrigin(config.marketingUrl, "NEXT_PUBLIC_MARKETING_URL");
  const appOrigin = readOrigin(config.appUrl, "NEXT_PUBLIC_APP_URL");

  // Path-based routing remains available when domains are not configured locally.
  if (!marketingOrigin || !appOrigin || marketingOrigin.host === appOrigin.host) {
    return { action: "next" };
  }

  const normalizedHost = requestHost.toLowerCase().replace(/\.$/, "");
  const isMarketingHost = normalizedHost === marketingOrigin.host.toLowerCase();
  const isAppHost = normalizedHost === appOrigin.host.toLowerCase();

  if (isMarketingHost && PRODUCT_PATH_PREFIXES.some((prefix) => matchesPrefix(requestUrl.pathname, prefix))) {
    return { action: "redirect", url: redirectTo(appOrigin, requestUrl) };
  }

  if (isAppHost && requestUrl.pathname === "/") {
    return { action: "rewrite", pathname: "/dashboard" };
  }

  if (isAppHost && MARKETING_PATHS.has(requestUrl.pathname)) {
    return { action: "redirect", url: redirectTo(marketingOrigin, requestUrl) };
  }

  return { action: "next" };
}
