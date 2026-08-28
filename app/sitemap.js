import { siteConfig } from "../lib/siteConfig";

export default function sitemap() {
  const lastModified = new Date("2026-08-28");
  const publicPaths = ["", "/pricing", "/terms", "/privacy", "/refunds", "/cookies", "/contact"];

  return publicPaths.map((path) => ({
    url: `${siteConfig.siteUrl}${path}`,
    lastModified,
    changeFrequency: path ? "monthly" : "weekly",
    priority: path ? 0.6 : 1,
  }));
}
