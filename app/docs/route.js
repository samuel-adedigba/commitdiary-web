import { configuredRedirect, siteConfig } from "../../lib/siteConfig";

export function GET(request) {
  if (!siteConfig.docsUrl) {
    return Response.redirect(new URL("/#how-it-works", request.url), 307);
  }

  return configuredRedirect(siteConfig.docsUrl, request.url);
}
