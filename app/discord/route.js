import { configuredRedirect, siteConfig } from "../../lib/siteConfig";

export function GET(request) {
  if (!siteConfig.discordDocsUrl) {
    return Response.redirect(new URL("/#setup", request.url), 307);
  }

  return configuredRedirect(siteConfig.discordDocsUrl, request.url);
}
