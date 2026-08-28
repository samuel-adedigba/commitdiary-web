import { siteConfig } from "../lib/siteConfig";

const disallow = [
  "/api/",
  "/v1/",
  "/dashboard",
  "/commits",
  "/repositories",
  "/shares",
  "/pages/settings",
  "/authentication/",
];

const retrievalAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...retrievalAgents.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    host: siteConfig.siteUrl,
  };
}
