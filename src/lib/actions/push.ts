"use server";

import { MAX_PUSH_SUBSCRIPTIONS_PER_USER, nativeTokenSchema, webPushSubscriptionSchema } from "@/lib/push-validation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// `input` comes from the browser, so what it holds is checked here: the endpoint is a URL this server
// will POST to (see push-validation.ts), and nobody needs more than a handful of devices.
export async function savePushSubscriptionAction(input: { endpoint: string; p256dh: string; auth: string }) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");
  const sub = webPushSubscriptionSchema.parse(input);

  const count = await prisma.pushSubscription.count({ where: { userId: session.user.id, NOT: { endpoint: sub.endpoint } } });
  if (count >= MAX_PUSH_SUBSCRIPTIONS_PER_USER) throw new Error("Too many devices.");

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId: session.user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    update: { userId: session.user.id, p256dh: sub.p256dh, auth: sub.auth },
  });
}

export async function deletePushSubscriptionAction(endpoint: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
}

// Upsert keyed on the token alone: a device that was used by another
// account before simply moves over to whoever is signed in now.
export async function saveNativePushTokenAction(input: { token: string; platform: "ios" | "android" }) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

  const { token, platform } = nativeTokenSchema.parse(input);
  const nativePlatform = platform === "ios" ? "IOS" : "ANDROID";

  const count = await prisma.nativePushToken.count({ where: { userId: session.user.id, NOT: { token } } });
  if (count >= MAX_PUSH_SUBSCRIPTIONS_PER_USER) throw new Error("Too many devices.");

  await prisma.nativePushToken.upsert({
    where: { token },
    create: { userId: session.user.id, token, platform: nativePlatform },
    update: { userId: session.user.id, platform: nativePlatform },
  });
}

export async function deleteNativePushTokenAction(token: string) {
  const session = await auth();
  if (!session) return;

  await prisma.nativePushToken.deleteMany({ where: { token, userId: session.user.id } });
}
