"use server";

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
