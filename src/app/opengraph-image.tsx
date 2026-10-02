import { OG_ALT, ogImage } from "@/lib/og-images";

// Share preview for the landing page, and the default every route inherits unless it has its own (see login, signup, faq, legal…).
export const alt = OG_ALT.product;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage("product");
}
