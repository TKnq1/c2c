import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreatorFeed } from "@/lib/visibility";
import { parseFeedScope } from "@/lib/feed-scope";
import { photoUrlsByRequestId } from "@/lib/request-photos";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { CreatorFeed } from "@/components/creator-feed";
import { FeedScopeTabs } from "@/components/feed-scope-tabs";
import { SkeletonCardList } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { DealsWaitingCard } from "@/components/deals/deals-waiting-card";
import { getT } from "@/lib/i18n/server";

export default async function CreatorFeedPage(props: PageProps<"/dashboard/creator">) {
  const t = await getT();
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");
  const scope = parseFeedScope((await props.searchParams).feed);

  const [creator, blockedUserIds] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      include: { interests: true, platforms: true, passes: { select: { requestId: true } } },
    }),
    getMutualBlockedUserIds(session.user.id),
  ]);

  const matching = await getCreatorFeed(creator, blockedUserIds, scope);
  // Already decided: swiped away on an earlier visit, or an interest exists
  // (yours, or the brand reaching out first) — those live on the Matches
  // page, the swipe stack is only ever fresh ones. Filtered here, not in
  // getCreatorFeed, since that also decides what a creator may still message
  // a brand about.
  const decidedRequestIds = new Set([...creator.interests.map((i) => i.requestId), ...creator.passes.map((p) => p.requestId)]);
  const requests = matching.filter((r) => !decidedRequestIds.has(r.id));

  const startupIds = requests.map((r) => r.startup.id);
  const [ratingGroups, favorites, photos] = await Promise.all([
    // Same "brand reputation, from other creators' reviews" rating shown on
    // Discover — a creator deciding whether to swipe right benefits from
    // the same trust signal, not just once they're already on a profile.
    prisma.review.groupBy({
      by: ["startupId"],
      where: { authorRole: "CREATOR", startupId: { in: startupIds } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    // The Feed's star saves the brand behind a request, same Favorite row
    // as the star on Discover — so it has to know which ones already are.
    prisma.favorite.findMany({
      where: { creatorId: creator.id, favoritedByRole: "CREATOR", startupId: { in: startupIds } },
      select: { startupId: true },
    }),
    photoUrlsByRequestId(requests),
  ]);
  const ratingByStartupId = new Map(
    ratingGroups.map((g) => [g.startupId, { average: g._avg.rating ?? 0, count: g._count._all }]),
  );
  const favoritedStartupIds = new Set(favorites.map((f) => f.startupId));

  return (
    <div className="flex flex-col gap-3 md:gap-6">
      <PageTitle>{t("nav.feed")}</PageTitle>
      <Suspense fallback={null}>
        <DealsWaitingCard userId={session.user.id} role="CREATOR" />
      </Suspense>
      {/* On a phone the same switch lives in the top bar, in place of "Feed". */}
      <div className="hidden justify-center md:flex">
        <FeedScopeTabs scope={scope} />
      </div>
      {matching.length === 0 ? (
        scope === "forYou" ? (
          <EmptyState
            icon={FiSearch}
            title={t("screens.feed.emptyNiches")}
            description={t("screens.feed.emptyNichesBody")}
            action={{ label: t("screens.feed.showAll"), href: "/dashboard/creator?feed=all" }}
          />
        ) : (
          <EmptyState
            icon={FiSearch}
            title={t("screens.feed.emptyAll")}
            description={t("screens.feed.emptyAllBody")}
            action={{ label: t("screens.feed.browseDiscover"), href: "/dashboard/creator/discover" }}
          />
        )
      ) : (
        <Suspense fallback={<SkeletonCardList />}>
          <CreatorFeed
            scope={scope}
            requests={requests.map((r) => ({
              id: r.id,
              startupId: r.startup.id,
              isBrandFavorited: favoritedStartupIds.has(r.startup.id),
              title: r.title,
              description: r.description,
              niche: r.niche,
              languages: r.languages,
              minFollowers: r.minFollowers,
              productCategory: r.productCategory,
              companyName: r.startup.companyName,
              companyAvatarUrl: r.startup.avatarUrl,
              rating: ratingByStartupId.get(r.startup.id) ?? { average: 0, count: 0 },
              photos: photos.get(r.id) ?? [],
              budgetMinCents: r.budgetMinCents,
              budgetMaxCents: r.budgetMaxCents,
              platform: r.platform,
              deliverables: r.deliverables,
              postBy: r.postBy ? r.postBy.toISOString().slice(0, 10) : null,
              productIncluded: r.productIncluded,
            }))}
          />
        </Suspense>
      )}
    </div>
  );
}
