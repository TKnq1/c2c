// The Capacitor store apps append "C2CApp/ios" or "C2CApp/android" to the
// WebView's user agent (see capacitor.config.ts). Safe to import from both
// server and client code.
export type NativePlatformName = "ios" | "android";

const NATIVE_UA_PATTERN = /\bC2CApp\/(ios|android)\b/;

export function nativePlatformFromUserAgent(userAgent: string | null | undefined): NativePlatformName | null {
  const match = userAgent?.match(NATIVE_UA_PATTERN);
  return match ? (match[1] as NativePlatformName) : null;
}
