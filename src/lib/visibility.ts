import { prisma } from "@/lib/prisma";
import { requestPhotoIds } from "@/lib/request-photos";
import { creatorFeedWhere, type FeedCreator, type FeedScope } from "@/lib/feed-scope";

/**
 * A creator's feed: open requests whose follower threshold is cleared by ANY
 * of their platforms — requests aren't platform-specific, so the highest
 * reach across platforms is what's checked. Requests from a mutually-blocked
 * brand are excluded entirely (see creatorFeedWhere).
 *
 * The scope decides the niche: "forYou" keeps to the creator's niches, "all"
 * doesn't look at them. "all" is also what a creator may still reach out to
 * (see createInterestAsCreator), since the Feed lets them swipe on it.
 *
 * Takes blockedUserIds rather than fetching it internally — every caller
 * already needs it (or can get it) alongside other queries it's running in
 * the same Promise.all, and fetching it in here instead would force an
 * extra sequential round-trip after that Promise.all rather than joining it.
 */
export async function getCreatorFeed(
  creator: FeedCreator,
  blockedUserIds: string[],
  scope: FeedScope,
  // `requestId` / `startupId` narrow it to one request or one brand, which is how a single request is
  // checked against the feed. Without either the list is capped: nobody swipes through more than this,
  // and an unbounded query is a cheap way to slow the database down.
  options: { requestId?: string; startupId?: string } = {},
) {
  const narrowed = options.requestId !== undefined || options.startupId !== undefined;
  return prisma.request.findMany({
    where: {
      ...creatorFeedWhere(creator, blockedUserIds, scope),
      ...(options.requestId !== undefined && { id: options.requestId }),
      ...(options.startupId !== undefined && { startupId: options.startupId }),
    },
    // Photo ids only (served by /api/request-images), never the legacy
    // data-URI column — a feed would otherwise ship every image inline.
    // The brand's public side only: callers pass these rows around, and the whole profile
    // row carries Stripe ids.
    include: { startup: { select: { id: true, userId: true, companyName: true, avatarUrl: true } }, ...requestPhotoIds },
    omit: { imageUrl: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...(narrowed ? {} : { take: 300 }),
  });
}
