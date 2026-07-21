import { siteConfig } from "../lib/siteConfig";

export default function sitemap() {
  if (!siteConfig.siteUrl) return [];

  return [
    {
      url: siteConfig.siteUrl,
      lastModified: new Date("2026-07-21"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
