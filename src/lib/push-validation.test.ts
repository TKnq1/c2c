import { describe, expect, it } from "vitest";
import { isPushEndpoint, nativeTokenSchema, webPushSubscriptionSchema } from "@/lib/push-validation";

describe("isPushEndpoint", () => {
  it("accepts the browsers' push services", () => {
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(isPushEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(isPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=abc")).toBe(true);
  });

  it("refuses everything else, however it is dressed up", () => {
    for (const bad of [
      "http://fcm.googleapis.com/fcm/send/abc",
      "https://evil.example/fcm.googleapis.com",
      "https://fcm.googleapis.com.evil.example/x",
      "https://evilfcm.googleapis.com.example/x",
      "https://user:pass@fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
      "https://169.254.169.254/latest/meta-data",
      "https://localhost/x",
      "not a url",
      "",
    ]) {
      expect(isPushEndpoint(bad)).toBe(false);
    }
  });
});

describe("webPushSubscriptionSchema", () => {
  const good = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "B".repeat(87), auth: "a".repeat(22) };

  it("takes a real-looking subscription", () => {
    expect(webPushSubscriptionSchema.safeParse(good).success).toBe(true);
  });

  it("refuses odd keys and endpoints", () => {
    expect(webPushSubscriptionSchema.safeParse({ ...good, p256dh: "short" }).success).toBe(false);
    expect(webPushSubscriptionSchema.safeParse({ ...good, endpoint: "https://evil.example/x" }).success).toBe(false);
    expect(webPushSubscriptionSchema.safeParse({ ...good, endpoint: "https://fcm.googleapis.com/" + "a".repeat(1000) }).success).toBe(false);
  });
});

describe("nativeTokenSchema", () => {
  it("lets only a hex token through for iOS, since it ends up in a request path", () => {
    expect(nativeTokenSchema.safeParse({ platform: "ios", token: "ab".repeat(32) }).success).toBe(true);
    expect(nativeTokenSchema.safeParse({ platform: "ios", token: "../../3/device/x?y=" + "a".repeat(64) }).success).toBe(false);
    expect(nativeTokenSchema.safeParse({ platform: "ios", token: "xyz" }).success).toBe(false);
  });

  it("accepts an FCM-looking token for Android only", () => {
    const fcm = `${"a".repeat(60)}:${"B".repeat(80)}`;
    expect(nativeTokenSchema.safeParse({ platform: "android", token: fcm }).success).toBe(true);
    expect(nativeTokenSchema.safeParse({ platform: "android", token: "/../" + fcm }).success).toBe(false);
  });
});
