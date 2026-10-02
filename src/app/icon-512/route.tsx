import { appIcon } from "@/lib/og-images";

// See icon-192/route.tsx — same reasoning, the 512x512 manifest entry.
export function GET() {
  return appIcon(512, { rounded: true });
}
