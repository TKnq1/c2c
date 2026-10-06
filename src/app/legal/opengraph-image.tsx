import { getLocale } from "@/lib/i18n/server";
import { OG_ALT, ogImage } from "@/lib/og-images";

// Shared links to this page get the calm default preview rather than the landing page's.
export const alt = OG_ALT.clean;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return ogImage("clean", await getLocale());
}
