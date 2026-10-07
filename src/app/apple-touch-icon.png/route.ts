import { appIcon } from "@/lib/og-images";

// Safari (Favorites, Top Sites, Reading List) and iOS ask for this exact path on their own, whatever the page's
// <link> tags say: the same icon as /apple-icon, at the path they look for.
export function GET() {
  return appIcon(180, { ios: true });
}
