"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function revalidateSubscriptionPaths() {
  revalidatePath("/dashboard/startup/settings");
  revalidatePath("/dashboard/startup/payments");
}

// Simulated subscribe — no real charge happens (no Stripe), just the
// discounted-fee state flipping on. Disclosed everywhere this is shown.
export async function subscribeToProAction() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  await prisma.startupProfile.update({
    where: { userId: session.user.id },
    data: { isPro: true, proSince: new Date() },
  });

  revalidateSubscriptionPaths();
}

export async function cancelProAction() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  await prisma.startupProfile.update({
    where: { userId: session.user.id },
    data: { isPro: false },
  });

  revalidateSubscriptionPaths();
}
