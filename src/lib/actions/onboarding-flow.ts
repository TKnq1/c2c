"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creatorFeedWhere } from "@/lib/feed-scope";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { formatBudget } from "@/lib/format";
import { ONBOARDING_EVENT_KINDS, onboardingStepKeys } from "@/lib/onboarding-flow";

const trackSchema = z.object({ step: z.string().max(32), kind: z.enum(ONBOARDING_EVENT_KINDS) });

// Fire-and-forget from the wizard. Measuring is never worth breaking
// onboarding over, so every failure (including a database that doesn't have
// the table yet on a preview deploy) is swallowed.
export async function trackOnboardingEventAction(input: { step: string; kind: string }): Promise<void> {
  try {
    const session = await auth();
    const role = session?.user.role;
    if (!session || (role !== "CREATOR" && role !== "STARTUP")) return;
    const parsed = trackSchema.safeParse(input);
    if (!parsed.success || !onboardingStepKeys(role).includes(parsed.data.step)) return;
    await prisma.onboardingEvent.createMany({
      data: [{ userId: session.user.id, role, step: parsed.data.step, kind: parsed.data.kind }],
      skipDuplicates: true,
    });
  } catch {
    // See above.
  }
}

export type CreatorMatchesResult =
  | {
      matches: number;
      // Everything that fits the creator's reach, whatever its niche.
      fitsReach: number;
      top: {
        id: string;
        title: string;
        companyName: string;
        companyAvatarUrl: string | null;
        niche: string;
        budget: string | null;
        platform: string | null;
        deliverables: string | null;
      }[];
    }
  | { error: string };

// The creator's "aha": what is waiting in their feed, from the same query
// the Feed runs. Biggest budgets first, since that is what makes someone
// look twice.
export async function getCreatorMatchesAction(): Promise<CreatorMatchesResult> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") return { error: "Not authorized." };

  const [creator, blockedUserIds] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      select: { niches: true, contentLanguage: true, platforms: { select: { followerCount: true } } },
    }),
    getMutualBlockedUserIds(session.user.id),
  ]);

  const forYou = creatorFeedWhere(creator, blockedUserIds, "forYou");
  const [matches, fitsReach, top] = await Promise.all([
    prisma.request.count({ where: forYou }),
    prisma.request.count({ where: creatorFeedWhere(creator, blockedUserIds, "all") }),
    prisma.request.findMany({
      where: forYou,
      orderBy: [{ budgetMaxCents: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        niche: true,
        budgetMinCents: true,
        budgetMaxCents: true,
        platform: true,
        deliverables: true,
        startup: { select: { companyName: true, avatarUrl: true } },
      },
    }),
  ]);

  return {
    matches,
    fitsReach,
    top: top.map((r) => ({
      id: r.id,
      title: r.title,
      companyName: r.startup.companyName,
      companyAvatarUrl: r.startup.avatarUrl,
      niche: r.niche,
      budget: formatBudget(r.budgetMinCents, r.budgetMaxCents),
      platform: r.platform,
      deliverables: r.deliverables,
    })),
  };
}

export type BrandCreatorsResult =
  | {
      niche: string;
      creators: number;
      // With a platform of 10K+ followers.
      established: number;
      sample: { id: string; displayName: string; avatarUrl: string | null }[];
    }
  | { error: string };

// The brand's "aha": how many creators in their niche are already here,
// and a few of them.
export async function getBrandCreatorsAction(): Promise<BrandCreatorsResult> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const [profile, blockedUserIds] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id }, select: { niche: true } }),
    getMutualBlockedUserIds(session.user.id),
  ]);
  const niche = profile.niche;
  if (!niche) return { error: "Choose a niche first." };

  const inNiche = { niches: { has: niche }, userId: { notIn: blockedUserIds }, user: { suspendedAt: null } };
  const [creators, established, sample] = await Promise.all([
    prisma.creatorProfile.count({ where: inNiche }),
    prisma.creatorProfile.count({ where: { ...inNiche, platforms: { some: { followerCount: { gte: 10_000 } } } } }),
    prisma.creatorProfile.findMany({
      where: { ...inNiche, avatarUrl: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, displayName: true, avatarUrl: true },
    }),
  ]);

  return { niche, creators, established, sample };
}
