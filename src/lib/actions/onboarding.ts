"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { processAvatarUpload } from "@/lib/avatar-upload";
import { creatorNicheColumns } from "@/lib/creator-niches";
import {
  onboardingCompanyNameSchema,
  onboardingDisplayNameSchema,
  onboardingNicheSchema,
  onboardingNichesSchema,
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

export async function saveBrandNicheAction(
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

  // No revalidatePath here or in the steps after: it would re-render
  // /onboarding, which now counts the profile as complete and redirects
  // away before the photo step and the "all set" screen. The dashboard
  // renders per request anyway.
  return { success: true };
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

export async function saveNichesAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") return { error: "Not authorized." };

  const parsed = onboardingNichesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please choose a niche." };
  }

  await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: creatorNicheColumns(parsed.data.niches),
  });

  return { success: true };
}

export async function savePlatformsAction(
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
    where: { niche: { in: creator.niches }, minFollowers: { lte: maxFollowers }, status: "OPEN" },
    include: { startup: true },
  });
  const notifiedStartupIds = new Set<string>();
  for (const r of matchingRequests) {
    if (notifiedStartupIds.has(r.startupId)) continue;
    notifiedStartupIds.add(r.startupId);
    await notify(
      r.startup.userId,
      `New ${r.niche} creator joined: ${creator.displayName}`,
      `/dashboard/startup/discover/${creator.id}`,
      "newCreators",
    );
  }

  // See saveBrandNicheAction on why there's no revalidatePath.
  return { success: true };
}

// Optional last step for both roles: a photo (creators) or logo (brands).
// Skipping it never calls this.
export async function saveOnboardingPhotoAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) {
    return { error: "Not authorized." };
  }

  const isBrand = session.user.role === "STARTUP";
  const { avatarUrl, error } = await processAvatarUpload(formData, isBrand ? "Logo" : "Photo");
  if (error) return { error };
  if (!avatarUrl) return { error: isBrand ? "Choose a logo first." : "Choose a photo first." };

  if (isBrand) {
    await prisma.startupProfile.update({ where: { userId: session.user.id }, data: { avatarUrl } });
  } else {
    await prisma.creatorProfile.update({ where: { userId: session.user.id }, data: { avatarUrl } });
  }

  return { success: true };
}
