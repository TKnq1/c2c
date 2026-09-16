import { prisma } from "@/lib/prisma";
import { getMutualBlockedUserIds } from "@/lib/moderation";

/**
 * A creator's feed: every request matching niche + follower threshold. A
 * creator qualifies if ANY of their platforms clears the request's
 * minFollowers — requests aren't platform-specific, so the highest reach
 * across platforms is what's checked. Requests from a mutually-blocked
 * brand are excluded entirely.
 */
export async function getCreatorFeed(
  creator: { niche: string; platforms: { followerCount: number }[] },
  viewerUserId: string,
) {
  const maxFollowers = creator.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
  const blockedUserIds = await getMutualBlockedUserIds(viewerUserId);
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
