import { ogNiche } from "@/lib/og-images";
import { UGC_CREATOR_PAGE } from "@/lib/seo-pages";

export const alt = "comtor – Als UGC-Creator Geld verdienen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogNiche(UGC_CREATOR_PAGE.ogLines, "");
}
