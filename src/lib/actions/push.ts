"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function savePushSubscriptionAction(sub: { endpoint: string; p256dh: string; auth: string }) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

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

const nativeTokenSchema = z.object({
  token: z.string().min(1).max(4096),
  platform: z.enum(["ios", "android"]),
});

// Upsert keyed on the token alone: a device that was used by another
// account before simply moves over to whoever is signed in now.
export async function saveNativePushTokenAction(input: { token: string; platform: "ios" | "android" }) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

  const { token, platform } = nativeTokenSchema.parse(input);
  const nativePlatform = platform === "ios" ? "IOS" : "ANDROID";

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
