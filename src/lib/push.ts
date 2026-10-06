import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { apnsConfigured, fcmConfigured, sendApns, sendFcm, type PushPayload } from "@/lib/native-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const webPushConfigured = Boolean(publicKey && privateKey);

if (webPushConfigured) {
  webpush.setVapidDetails("mailto:info@comtor.app", publicKey!, privateKey!);
}

// Fans out to every device the user enabled push on: browsers via Web Push
// (our own VAPID keys, no third-party account), the iOS app via APNs and the
// Android app via FCM. Each channel no-ops quietly if its keys aren't set,
// so a notify() call is always safe to make regardless of push being set up.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  await Promise.all([sendWebPush(userId, payload), sendNativePush(userId, payload)]);
}

async function sendWebPush(userId: string, payload: PushPayload) {
  if (!webPushConfigured) return;

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

async function sendNativePush(userId: string, payload: PushPayload) {
  if (!apnsConfigured && !fcmConfigured) return;

  const tokens = await prisma.nativePushToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  await Promise.all(
    tokens.map(async ({ id, token, platform }) => {
      const result = platform === "IOS" ? await sendApns(token, payload) : await sendFcm(token, payload);
      if (result === "invalid") {
        await prisma.nativePushToken.delete({ where: { id } }).catch(() => {});
      }
    }),
  );
}
