import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated areas and the API — nothing there is meant to be
      // crawled. Token pages (password reset, email verification) and
      // onboarding aren't listed: they carry a noindex tag instead, which
      // crawlers only see if they're allowed to fetch the page.
      disallow: ["/dashboard/", "/admin/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
