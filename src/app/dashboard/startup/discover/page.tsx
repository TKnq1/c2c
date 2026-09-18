import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { computeResponseTimeMs, formatResponseTime } from "@/lib/response-time";
import { DiscoverCreators } from "@/components/discover-creators";
import { FavoritesOnlyToggle } from "@/components/favorites-only-toggle";
import { SkeletonCardList } from "@/components/skeleton";

/* eslint-disable react-hooks/purity -- temporary perf instrumentation, reverted after measuring */
export default async function DiscoverCreatorsPage() {
  const _t0 = Date.now();
  const session = await auth();
  console.log(`[PERF] auth: ${Date.now() - _t0}ms`);
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const _t1 = Date.now();
  const [startup, blockedUserIds, savedFilters] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      // Filtered — a creator favoriting this startup back writes a row with
      // the same startupId but the opposite favoritedByRole, and that's not
      // "this startup's favorites."
      include: { favorites: { where: { favoritedByRole: "STARTUP" } } },
    }),
    getMutualBlockedUserIds(session.user.id),
    prisma.savedFilter.findMany({
      where: { userId: session.user.id, scope: "discover-creators" },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  console.log(`[PERF] wave1: ${Date.now() - _t1}ms`);
  const favoritedCreatorIds = new Set(startup.favorites.map((f) => f.creatorId));
  const _t2 = Date.now();

  // None of these four depend on each other's results, so they run as one
  // round-trip instead of four sequential ones — each extra round-trip to
  // Neon is real added latency, not free. interestsForResponseTime filters
  // by the same notIn-blockedUserIds condition (via the creator relation)
  // rather than by creators' ids, specifically so it doesn't have to wait
  // on the creators query above to know what to ask for.
  const [creators, ratingGroups, completedGroups, interestsForResponseTime] = await Promise.all([
    prisma.creatorProfile.findMany({
      where: { userId: { notIn: blockedUserIds } },
      include: { platforms: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.groupBy({
      by: ["creatorId"],
      where: { authorRole: "STARTUP" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    // Completed collabs — a released payment is the clearest signal a collab
    // actually finished successfully, so it's a faster trust check than
    // opening every profile to read reviews one by one.
    prisma.interest.groupBy({
      by: ["creatorId"],
      where: { paymentStatus: "RELEASED" },
      _count: { _all: true },
    }),
    prisma.interest.findMany({
      where: { creator: { userId: { notIn: blockedUserIds } } },
      select: { creatorId: true, messages: { orderBy: { createdAt: "asc" }, select: { senderRole: true, createdAt: true } } },
    }),
  ]);
  console.log(`[PERF] wave2: ${Date.now() - _t2}ms, total so far: ${Date.now() - _t0}ms`);
  const ratingByCreatorId = new Map(
    ratingGroups.map((g) => [g.creatorId, { average: g._avg.rating ?? 0, count: g._count._all }]),
  );
  const completedByCreatorId = new Map(completedGroups.map((g) => [g.creatorId, g._count._all]));
  const conversationsByCreatorId = new Map<string, { senderRole: Role; createdAt: Date }[][]>();
  for (const interest of interestsForResponseTime) {
    const list = conversationsByCreatorId.get(interest.creatorId) ?? [];
    list.push(interest.messages);
    conversationsByCreatorId.set(interest.creatorId, list);
  }

  const creatorsWithRatings = creators.map((c) => {
    const responseTimeMs = computeResponseTimeMs(conversationsByCreatorId.get(c.id) ?? [], "CREATOR");
    return {
      ...c,
      rating: ratingByCreatorId.get(c.id) ?? { average: 0, count: 0 },
      completedCollabs: completedByCreatorId.get(c.id) ?? 0,
      isFavorited: favoritedCreatorIds.has(c.id),
      createdAt: c.createdAt.getTime(),
      responseTimeMs,
      responseTimeLabel: formatResponseTime(responseTimeMs),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-normal">Discover Creators</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
            Browse creators across every niche and filter down to the right fit.
          </p>
        </div>
        <FavoritesOnlyToggle />
      </div>
      <Suspense fallback={<SkeletonCardList />}>
        <DiscoverCreators creators={creatorsWithRatings} savedFilters={savedFilters} />
      </Suspense>
    </div>
  );
}
