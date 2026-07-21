import { siteConfig } from "../lib/siteConfig";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/v1/",
        "/dashboard",
        "/commits",
        "/repositories",
        "/shares",
        "/pages/settings",
        "/authentication/",
      ],
    },
    ...(siteConfig.siteUrl ? { sitemap: `${siteConfig.siteUrl}/sitemap.xml`, host: siteConfig.siteUrl } : {}),
  };
}
