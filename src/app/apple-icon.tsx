import { appIcon } from "@/lib/og-images";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Full-bleed square, no corners of our own: iOS applies its rounded mask
// on top, so drawing one here would leave a ring inside it.
export default function AppleIcon() {
  return appIcon(180, { rounded: false });
}
