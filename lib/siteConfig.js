const readPublicUrl = (name) => process.env[name] || "";

export const siteConfig = {
  siteUrl: readPublicUrl("NEXT_PUBLIC_SITE_URL"),
  githubUrl: readPublicUrl("NEXT_PUBLIC_GITHUB_URL"),
  marketplaceUrl: readPublicUrl("NEXT_PUBLIC_MARKETPLACE_URL"),
  stepperUrl: readPublicUrl("NEXT_PUBLIC_STEPPER_URL"),
  docsUrl: readPublicUrl("NEXT_PUBLIC_DOCS_URL"),
  discordDocsUrl: readPublicUrl("NEXT_PUBLIC_DISCORD_DOCS_URL"),
};

export function configuredUrl(value, fallback = "/") {
  return value || fallback;
}

export function configuredRedirect(value, requestUrl) {
  if (!value) {
    return new Response(
      "This destination is not configured. Set the matching NEXT_PUBLIC_*_URL environment variable.",
      { status: 503 },
    );
  }

  return Response.redirect(new URL(value, requestUrl), 307);
}
