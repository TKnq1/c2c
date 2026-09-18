import { prisma } from "@/lib/prisma";

/**
 * A creator's feed: every request matching niche + follower threshold. A
 * creator qualifies if ANY of their platforms clears the request's
 * minFollowers — requests aren't platform-specific, so the highest reach
 * across platforms is what's checked. Requests from a mutually-blocked
 * brand are excluded entirely.
 *
 * Takes blockedUserIds rather than fetching it internally — every caller
 * already needs it (or can get it) alongside other queries it's running in
 * the same Promise.all, and fetching it in here instead would force an
 * extra sequential round-trip after that Promise.all rather than joining it.
 */
export async function getCreatorFeed(
  creator: { niche: string; platforms: { followerCount: number }[] },
  blockedUserIds: string[],
) {
  const maxFollowers = creator.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
  return prisma.request.findMany({
    where: {
      niche: creator.niche,
      minFollowers: { lte: maxFollowers },
      status: "OPEN",
      startup: { userId: { notIn: blockedUserIds } },
    },
    include: { startup: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
