import { configuredRedirect, siteConfig } from "../../lib/siteConfig";

export function GET(request) {
  return configuredRedirect(siteConfig.marketplaceUrl, request.url);
}
