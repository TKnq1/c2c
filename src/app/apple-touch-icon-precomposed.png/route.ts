import { appIcon } from "@/lib/og-images";

// The older name of /apple-touch-icon.png, which Safari still asks for.
export function GET() {
  return appIcon(180, { ios: true });
}
