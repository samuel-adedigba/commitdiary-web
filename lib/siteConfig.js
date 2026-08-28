const DEFAULT_SITE_URL = "https://commitdiary.dev";
const DEFAULT_MARKETPLACE_URL =
  "https://marketplace.visualstudio.com/items?itemName=samuel-adedigba.commitdiary-extension";
const DEFAULT_GITHUB_URL =
  "https://github.com/samuel-adedigba/Commit-Diary-Vscode-Extension";

export const siteConfig = {
  marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL || "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
  siteUrl: process.env.NEXT_PUBLIC_MARKETING_URL || DEFAULT_SITE_URL,
  marketplaceUrl: process.env.NEXT_PUBLIC_MARKETPLACE_URL || DEFAULT_MARKETPLACE_URL,
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL || "",
  discordDocsUrl: process.env.NEXT_PUBLIC_DISCORD_DOCS_URL || "",
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || DEFAULT_GITHUB_URL,
};

export const socialImage = {
  url: "/images/brand/commitdiary-og.png",
  width: 1200,
  height: 630,
  alt: "CommitDiary turns Git history into clear engineering work reports",
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
