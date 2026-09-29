import { headers } from "next/headers";
import { nativePlatformFromUserAgent, type NativePlatformName } from "@/lib/native-app";

// Which store app (if any) the current request comes from. Reads a request
// header, so it opts the calling route into dynamic rendering.
export async function getNativePlatform(): Promise<NativePlatformName | null> {
  const headerList = await headers();
  return nativePlatformFromUserAgent(headerList.get("user-agent"));
}
