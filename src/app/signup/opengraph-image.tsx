import { getLocale } from "@/lib/i18n/server";
import { OG_ALT, ogImage } from "@/lib/og-images";

// Shared sign-up links: the loud one, with the niches creators pick from.
export const alt = OG_ALT.bold;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return ogImage("bold", await getLocale());
}
