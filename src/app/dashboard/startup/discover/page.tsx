import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { computeResponseTimeMs, formatResponseTime } from "@/lib/response-time";
import { DiscoverCreators } from "@/components/discover-creators";
import { SkeletonTileGrid } from "@/components/skeleton";
import { PageTitle } from "@/components/page-title";
import { formatInfo, isPostFormat } from "@/lib/social/platforms";
import type { DiscoverRequest } from "@/lib/discover-filter";
import { getT } from "@/lib/i18n/server";

export default async function DiscoverCreatorsPage() {
  const t = await getT();
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const [startup, blockedUserIds] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      // Filtered — a creator favoriting this startup back writes a row with
      // the same startupId but the opposite favoritedByRole, and that's not
      // "this startup's favorites."
      include: { favorites: { where: { favoritedByRole: "STARTUP" } } },
    }),
    getMutualBlockedUserIds(session.user.id),
  ]);
  const favoritedCreatorIds = new Set(startup.favorites.map((f) => f.creatorId));

  // None of these four depend on each other's results, so they run as one
  // round-trip instead of four sequential ones — each extra round-trip to
  // Neon is real added latency, not free. interestsForResponseTime filters
  // by the same notIn-blockedUserIds condition (via the creator relation)
  // rather than by creators' ids, specifically so it doesn't have to wait
  // on the creators query above to know what to ask for.
  const [creators, ratingGroups, completedGroups, interestsForResponseTime, openRequests] = await Promise.all([
    prisma.creatorProfile.findMany({
      // Suspended accounts (see /admin/users) drop out of Discover entirely.
      where: { userId: { notIn: blockedUserIds }, user: { suspendedAt: null } },
      // Only what the cards show. This list is handed to a client component, which
      // ships every field of every row to the browser: never `include` a whole
      // profile here (it carries the Stripe account id and the user id).
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        niches: true,
        bio: true,
        contentLanguage: true,
        createdAt: true,
        platforms: { select: { platform: true, followerCount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
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
    // The brand's open requests: picking one sets the filters, and its existing chats turn "Invite" into "Open chat".
    prisma.request.findMany({
      where: { startupId: startup.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        niche: true,
        languages: true,
        minFollowers: true,
        platform: true,
        briefing: { select: { contentFormats: true } },
        interests: { select: { id: true, creatorId: true } },
      },
    }),
  ]);
  const requests: DiscoverRequest[] = openRequests.map((r) => {
    // The briefing's formats name the platforms; a request from before briefings has its one platform.
    const fromFormats = (r.briefing?.contentFormats ?? []).filter(isPostFormat).map((f) => formatInfo(f).platform as string);
    const platforms = fromFormats.length > 0 ? [...new Set(fromFormats)] : r.platform ? [r.platform] : [];
    return {
      id: r.id,
      title: r.title,
      niche: r.niche,
      languages: r.languages,
      minFollowers: r.minFollowers,
      platforms,
      chats: Object.fromEntries(r.interests.map((i) => [i.creatorId, i.id])),
    };
  });
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
      id: c.id,
      displayName: c.displayName,
      avatarUrl: c.avatarUrl,
      niches: c.niches,
      bio: c.bio,
      contentLanguage: c.contentLanguage,
      platforms: c.platforms,
      rating: ratingByCreatorId.get(c.id) ?? { average: 0, count: 0 },
      completedCollabs: completedByCreatorId.get(c.id) ?? 0,
      isFavorited: favoritedCreatorIds.has(c.id),
      createdAt: c.createdAt.getTime(),
      responseTimeMs,
      responseTimeLabel: formatResponseTime(responseTimeMs, t),
    };
  });

  return (
    <div className="page-wide flex flex-col gap-5">
      {/* On phones the header names the page (see pageTitleKey in nav.tsx). */}
      <PageTitle description={t("extras.misc.creatorsHint")}>{t("screens.discover.creators")}</PageTitle>
      <Suspense fallback={<SkeletonTileGrid />}>
        <DiscoverCreators creators={creatorsWithRatings} requests={requests} />
      </Suspense>
    </div>
  );
}
