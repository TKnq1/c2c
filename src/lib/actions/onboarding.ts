"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import {
  onboardingCompanyNameSchema,
  onboardingDisplayNameSchema,
  onboardingNicheSchema,
  onboardingPlatformsSchema,
} from "@/lib/validation";

export type OnboardingState = { error?: string; success?: boolean } | undefined;

export async function saveCompanyNameAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const parsed = onboardingCompanyNameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter your company name." };
  }

  await prisma.startupProfile.update({
    where: { userId: session.user.id },
    data: { companyName: parsed.data.companyName },
  });

  return { success: true };
}

export async function finishBrandOnboardingAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const parsed = onboardingNicheSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please choose a niche." };
  }

  await prisma.startupProfile.update({
    where: { userId: session.user.id },
    data: { niche: parsed.data.niche },
  });

  revalidatePath("/dashboard/startup");
  redirect("/dashboard/startup?welcome=1");
}

export async function saveDisplayNameAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") return { error: "Not authorized." };

  const parsed = onboardingDisplayNameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter your display name." };
  }

  await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: { displayName: parsed.data.displayName },
  });

  return { success: true };
}

export async function saveNicheAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") return { error: "Not authorized." };

  const parsed = onboardingNicheSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please choose a niche." };
  }

  await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: { niche: parsed.data.niche },
  });

  return { success: true };
}

export async function finishCreatorOnboardingAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") return { error: "Not authorized." };

  const parsed = onboardingPlatformsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please add at least one platform." };
  }

  const creator = await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: {
      platforms: { create: parsed.data.platforms.map((p) => ({ ...p, url: p.url || null })) },
    },
  });

  // Same "let matching brands know" notification signup used to send in
  // one shot — moved here since a match needs niche + platforms, and
  // those aren't both known until this last onboarding step completes.
  // No block check needed: a brand-new account can't have any block
  // history yet.
  const maxFollowers = parsed.data.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
  const matchingRequests = await prisma.request.findMany({
    where: { niche: creator.niche, minFollowers: { lte: maxFollowers }, status: "OPEN" },
    include: { startup: true },
  });
  const notifiedStartupIds = new Set<string>();
  for (const r of matchingRequests) {
    if (notifiedStartupIds.has(r.startupId)) continue;
    notifiedStartupIds.add(r.startupId);
    await notify(
      r.startup.userId,
      `New ${creator.niche} creator joined: ${creator.displayName}`,
      `/dashboard/startup/discover/${creator.id}`,
      "newCreators",
    );
  }

  revalidatePath("/dashboard/creator");
  redirect("/dashboard/creator?welcome=1");
}
