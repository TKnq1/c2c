import { z } from "zod";

// The browsers' push services. A subscription's endpoint is a URL our server later POSTs to, so it
// must be one of these and nothing else: anything else is a way to make the server send requests to
// a host of someone's choosing.
const PUSH_HOSTS = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
];

export function isPushEndpoint(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  return PUSH_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

export const MAX_PUSH_SUBSCRIPTIONS_PER_USER = 10;

export const webPushSubscriptionSchema = z.object({
  endpoint: z.string().max(1000).refine(isPushEndpoint, "Unsupported push service"),
  p256dh: z.string().regex(/^[A-Za-z0-9_-]{80,100}$/, "Invalid key"),
  auth: z.string().regex(/^[A-Za-z0-9_-]{16,32}$/, "Invalid key"),
});

// APNs device tokens are hex; FCM registration tokens are URL-safe strings with colons. The iOS one ends up
// in the path of a request to Apple (/3/device/<token>), so what it may contain is narrow.
export const nativeTokenSchema = z
  .object({
    platform: z.enum(["ios", "android"]),
    token: z.string().min(1).max(4096),
  })
  .superRefine((value, ctx) => {
    const ok = value.platform === "ios" ? /^[0-9a-fA-F]{64,200}$/.test(value.token) : /^[A-Za-z0-9_:\-.]{50,4096}$/.test(value.token);
    if (!ok) ctx.addIssue({ code: "custom", message: "Invalid device token" });
  });
