export const siteConfig = {
  marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL || "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
  siteUrl: process.env.NEXT_PUBLIC_MARKETING_URL || "",
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || "",
  marketplaceUrl: process.env.NEXT_PUBLIC_MARKETPLACE_URL || "",
  stepperUrl: process.env.NEXT_PUBLIC_STEPPER_URL || "",
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL || "",
  discordDocsUrl: process.env.NEXT_PUBLIC_DISCORD_DOCS_URL || "",
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
