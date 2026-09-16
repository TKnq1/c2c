import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The root "/" is intentionally left out — the real landing page is still
// being built elsewhere and "/" just redirects to /login for now. Add it
// back once the real page lands.
const PUBLIC_ROUTES = ["/login", "/signup", "/faq", "/legal/imprint", "/legal/terms", "/legal/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
