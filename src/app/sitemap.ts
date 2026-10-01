import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The landing page first: it's what comtor.app is.
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/faq", "/legal/imprint", "/legal/terms", "/legal/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
