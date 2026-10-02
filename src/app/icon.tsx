import { appIcon } from "@/lib/og-images";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Browser tab: the rounded black square (favicon.ico next to this carries
// the same artwork at 16/32/48 for browsers that ask for that first).
export default function Icon() {
  return appIcon(32, { rounded: true });
}
