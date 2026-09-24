import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreatorFeed } from "@/lib/visibility";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { CreatorFeed } from "@/components/creator-feed";
import { SkeletonCardList } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";

export default async function CreatorFeedPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  const [creator, blockedUserIds] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      include: { interests: true, platforms: true },
    }),
    getMutualBlockedUserIds(session.user.id),
  ]);

  const requests = await getCreatorFeed(creator, blockedUserIds);
  const interestByRequestId = new Map(creator.interests.map((i) => [i.requestId, i]));

  // Same "brand reputation, from other creators' reviews" rating shown on
  // Discover — a creator deciding whether to swipe right benefits from the
  // same trust signal, not just once they're already looking at a profile.
  const ratingGroups = await prisma.review.groupBy({
    by: ["startupId"],
    where: { authorRole: "CREATOR", startupId: { in: requests.map((r) => r.startup.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const ratingByStartupId = new Map(
    ratingGroups.map((g) => [g.startupId, { average: g._avg.rating ?? 0, count: g._count._all }]),
  );

  return (
    <div className="flex flex-col gap-6">
      {requests.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title="No matching requests yet."
          description="Check back later, or browse every brand on Discover in the meantime."
          action={{ label: "Browse Discover", href: "/dashboard/creator/discover" }}
        />
      ) : (
        <Suspense fallback={<SkeletonCardList />}>
          <CreatorFeed
            requests={requests.map((r) => {
              const interest = interestByRequestId.get(r.id);
              return {
                id: r.id,
                title: r.title,
                description: r.description,
                niche: r.niche,
                languages: r.languages,
                minFollowers: r.minFollowers,
                productCategory: r.productCategory,
                companyName: r.startup.companyName,
                companyAvatarUrl: r.startup.avatarUrl,
                rating: ratingByStartupId.get(r.startup.id) ?? { average: 0, count: 0 },
                imageUrl: r.imageUrl,
                interestId: interest?.id ?? null,
                contactedByStartup: interest?.initiatedBy === "STARTUP",
              };
            })}
          />
        </Suspense>
      )}
    </div>
  );
}
