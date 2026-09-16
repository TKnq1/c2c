"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireStartup() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");
  return prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
}

async function requireCreator() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") throw new Error("Not authorized.");
  return prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
}

export async function favoriteCreatorAction(creatorId: string) {
  const startup = await requireStartup();

  await prisma.favorite.upsert({
    where: { startupId_creatorId_favoritedByRole: { startupId: startup.id, creatorId, favoritedByRole: "STARTUP" } },
    create: { startupId: startup.id, creatorId, favoritedByRole: "STARTUP" },
    update: {},
  });

  revalidatePath("/dashboard/startup/discover");
  revalidatePath(`/dashboard/startup/discover/${creatorId}`);
}

export async function unfavoriteCreatorAction(creatorId: string) {
  const startup = await requireStartup();

  await prisma.favorite.deleteMany({
    where: { startupId: startup.id, creatorId, favoritedByRole: "STARTUP" },
  });

  revalidatePath("/dashboard/startup/discover");
  revalidatePath(`/dashboard/startup/discover/${creatorId}`);
}

export async function favoriteStartupAction(startupId: string) {
  const creator = await requireCreator();

  await prisma.favorite.upsert({
    where: {
      startupId_creatorId_favoritedByRole: { startupId, creatorId: creator.id, favoritedByRole: "CREATOR" },
    },
    create: { startupId, creatorId: creator.id, favoritedByRole: "CREATOR" },
    update: {},
  });

  revalidatePath("/dashboard/creator/discover");
  revalidatePath(`/dashboard/creator/discover/${startupId}`);
}

export async function unfavoriteStartupAction(startupId: string) {
  const creator = await requireCreator();

  await prisma.favorite.deleteMany({
    where: { startupId, creatorId: creator.id, favoritedByRole: "CREATOR" },
  });

  revalidatePath("/dashboard/creator/discover");
  revalidatePath(`/dashboard/creator/discover/${startupId}`);
}
