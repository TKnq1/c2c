import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const configured = Boolean(publicKey && privateKey);

if (configured) {
  webpush.setVapidDetails("mailto:support@example.com", publicKey!, privateKey!);
}

// Talks directly to the browser vendor's own push service using our own
// VAPID keys — no third-party account or API key involved. No-ops quietly
// if the keys aren't set, or if this user has no active subscription, so a
// notify() call is always safe to make regardless of push being set up.
export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!configured) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        // 404/410 means the browser dropped this subscription (uninstalled,
        // cleared data, ...) — clean it up instead of retrying forever.
        const statusCode = err && typeof err === "object" && "statusCode" in err ? err.statusCode : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
