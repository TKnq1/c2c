import { ogNiche } from "@/lib/og-images";

export const alt = "comtor – UGC-Creator finden";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogNiche(["UGC-Creator", "finden."], "");
}
