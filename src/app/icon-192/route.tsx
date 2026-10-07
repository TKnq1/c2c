import { appIcon } from "@/lib/og-images";

// Larger PWA install icon (Android/Chrome installability wants at least
// 192x192 and 512x512 in the manifest): the same artwork as the browser-tab
// icon (icon.png), at home-screen size.
export function GET() {
  return appIcon(192, { ios: false });
}
