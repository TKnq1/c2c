import type { MetadataRoute } from "next";
import { UGC_CREATOR_PATH, UGC_NICHE_PAGES, UGC_PATH, ugcNicheHref } from "@/lib/seo-pages";
import { SITE_URL } from "@/lib/site";

// The pages worth finding through search, landing page first. Login and the
// password pages stay out (they're either noindex or not worth ranking), and
// there's no lastModified: a date that's always "now" tells search engines
// nothing, and they ignore it.
const PUBLIC_ROUTES = [
  "/",
  "/signup",
  "/faq",
  // The German search pages: the overview and one per niche.
  UGC_PATH,
  UGC_CREATOR_PATH,
  ...UGC_NICHE_PAGES.map((page) => ugcNicheHref(page.slug)),
  "/legal/imprint",
  "/legal/terms",
  "/legal/privacy",
  "/legal/licenses",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path}` }));
}
