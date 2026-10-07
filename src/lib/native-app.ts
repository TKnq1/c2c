// The Capacitor store apps append "ComtorApp/ios" or "ComtorApp/android" to the
// WebView's user agent (see capacitor.config.ts). Safe to import from both
// server and client code.
export type NativePlatformName = "ios" | "android";

const NATIVE_UA_PATTERN = /\bComtorApp\/(ios|android)\b/;

export function nativePlatformFromUserAgent(userAgent: string | null | undefined): NativePlatformName | null {
  const match = userAgent?.match(NATIVE_UA_PATTERN);
  return match ? (match[1] as NativePlatformName) : null;
}

// A cheap look, before any Capacitor code is loaded, at whether this page runs inside a store app:
// the native shell injects its bridge into the WebView, and the apps tag the user agent. A
// website visitor passes none of these, so the Capacitor plugins are never downloaded for them.
// A "maybe" is enough: whoever passes still asks Capacitor itself (isNativeApp) once it is loaded.
export function mightBeNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const shell = window as unknown as { Capacitor?: unknown; androidBridge?: unknown; webkit?: { messageHandlers?: { bridge?: unknown } } };
  return Boolean(shell.Capacitor || shell.androidBridge || shell.webkit?.messageHandlers?.bridge || nativePlatformFromUserAgent(navigator.userAgent));
}
