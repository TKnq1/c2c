import { prisma } from "@/lib/prisma";
import { creatorFeedWhere } from "@/lib/feed-scope";
import type { OnboardingInsight } from "@/lib/onboarding-flow";

// The numbers the onboarding shows while it is still running. They count
// what the app would show the person right now: the same rules as the
// Feed (creatorFeedWhere) and the same "not suspended" rule as Discover.

export async function nicheRequestsInsight(niches: string[]): Promise<OnboardingInsight> {
  const groups = await prisma.request.groupBy({
    by: ["startupId"],
    where: { status: "OPEN", niche: { in: niches }, startup: { user: { suspendedAt: null } } },
    _count: { _all: true },
  });
  return {
    kind: "nicheRequests",
    niches,
    requests: groups.reduce((sum, g) => sum + g._count._all, 0),
    brands: groups.length,
  };
}

export async function reachRequestsInsight(creator: {
  niches: string[];
  contentLanguage: string | null;
  platforms: { followerCount: number }[];
}): Promise<OnboardingInsight> {
  // A brand-new account has no blocks yet, so there is nobody to leave out.
  const requests = await prisma.request.count({ where: creatorFeedWhere(creator, [], "forYou") });
  return { kind: "reachRequests", requests };
}

export async function brandNicheCreatorsInsight(niche: string): Promise<OnboardingInsight> {
  const creators = await prisma.creatorProfile.count({
    where: { niches: { has: niche }, user: { suspendedAt: null } },
  });
  return { kind: "brandNicheCreators", niche, creators };
}
