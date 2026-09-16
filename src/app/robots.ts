import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated areas — nothing there is meant to be publicly indexed.
      disallow: ["/dashboard/", "/admin/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
