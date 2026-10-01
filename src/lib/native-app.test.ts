import { describe, expect, it } from "vitest";
import { nativePlatformFromUserAgent } from "@/lib/native-app";

const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

describe("nativePlatformFromUserAgent", () => {
  it("recognizes the store apps by the suffix capacitor.config.ts appends", () => {
    expect(nativePlatformFromUserAgent(`${SAFARI_IPHONE} ComtorApp/ios`)).toBe("ios");
    expect(nativePlatformFromUserAgent(`${CHROME_ANDROID} ComtorApp/android`)).toBe("android");
  });

  it("treats every browser, installed PWA included, as the web", () => {
    expect(nativePlatformFromUserAgent(SAFARI_IPHONE)).toBeNull();
    expect(nativePlatformFromUserAgent(CHROME_ANDROID)).toBeNull();
    expect(nativePlatformFromUserAgent(null)).toBeNull();
    expect(nativePlatformFromUserAgent(undefined)).toBeNull();
  });

  it("doesn't match look-alike tokens", () => {
    expect(nativePlatformFromUserAgent(`${SAFARI_IPHONE} NotComtorApp/ios`)).toBeNull();
    expect(nativePlatformFromUserAgent(`${SAFARI_IPHONE} ComtorApp/web`)).toBeNull();
  });
});
