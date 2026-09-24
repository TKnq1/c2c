import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeResponseTimeMs, formatResponseTime } from "@/lib/response-time";
import { DiscoverBrands } from "@/components/discover-brands";
import { SkeletonCardList } from "@/components/skeleton";

export default async function DiscoverBrandsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  const [creator, brands] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.startupProfile.findMany({
      include: { socialLinks: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  // None of these four depend on each other's results (or on anything but
  // `brands`/`creator.id`, both already resolved above), so they run as one
  // round-trip instead of four sequential ones.
  const [favorites, ratingGroups, interestsForResponseTime, releasedInterests] = await Promise.all([
    prisma.favorite.findMany({
      where: { creatorId: creator.id, favoritedByRole: "CREATOR" },
      select: { startupId: true },
    }),
    prisma.review.groupBy({
      by: ["startupId"],
      where: { authorRole: "CREATOR" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.interest.findMany({
      where: { request: { startupId: { in: brands.map((b) => b.id) } } },
      select: {
        request: { select: { startupId: true } },
        messages: { orderBy: { createdAt: "asc" }, select: { senderRole: true, createdAt: true } },
      },
    }),
    // Interest.paymentStatus can't be grouped by request.startupId directly
    // (groupBy only supports scalar fields on the model itself), so tally it
    // by hand the same way the response-time data above already is.
    prisma.interest.findMany({
      where: { paymentStatus: "RELEASED", request: { startupId: { in: brands.map((b) => b.id) } } },
      select: { request: { select: { startupId: true } } },
    }),
  ]);
  const favoritedStartupIds = new Set(favorites.map((f) => f.startupId));
  const ratingByStartupId = new Map(
    ratingGroups.map((g) => [g.startupId, { average: g._avg.rating ?? 0, count: g._count._all }]),
  );
  const conversationsByStartupId = new Map<string, { senderRole: Role; createdAt: Date }[][]>();
  for (const interest of interestsForResponseTime) {
    const list = conversationsByStartupId.get(interest.request.startupId) ?? [];
    list.push(interest.messages);
    conversationsByStartupId.set(interest.request.startupId, list);
  }
  const completedByStartupId = new Map<string, number>();
  for (const i of releasedInterests) {
    completedByStartupId.set(i.request.startupId, (completedByStartupId.get(i.request.startupId) ?? 0) + 1);
  }

  const brandsWithRatings = brands.map((b) => {
    const responseTimeMs = computeResponseTimeMs(conversationsByStartupId.get(b.id) ?? [], "STARTUP");
    return {
      ...b,
      rating: ratingByStartupId.get(b.id) ?? { average: 0, count: 0 },
      completedCollabs: completedByStartupId.get(b.id) ?? 0,
      isFavorited: favoritedStartupIds.has(b.id),
      createdAt: b.createdAt.getTime(),
      responseTimeMs,
      responseTimeLabel: formatResponseTime(responseTimeMs),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* "Discover" now lives in the navbar title (see nav.tsx) instead of
          repeating it here as a page-level heading. The favorites-only
          toggle moved into DiscoverBrands' own search row, next to the
          search input, rather than sitting alone up here. */}
      <Suspense fallback={<SkeletonCardList />}>
        <DiscoverBrands brands={brandsWithRatings} />
      </Suspense>
    </div>
  );
}
