import type { Prisma } from "@prisma/client";

// "forYou": requests in one of the creator's niches. "all": every request the
// creator's reach qualifies for, whatever its niche.
export type FeedScope = "forYou" | "all";

// The Feed's ?feed= value; anything but "all" is "For you".
export function parseFeedScope(value: string | string[] | undefined): FeedScope {
  return value === "all" ? "all" : "forYou";
}

export type FeedCreator = {
  niches: string[];
  contentLanguage: string | null;
  platforms: { followerCount: number }[];
};

// What a creator's feed shows: open requests whose follower threshold ANY of
// their platforms clears and that are made in the creator's content language.
// The scope decides the niche — "all" drops that one condition and nothing
// else.
export function creatorFeedWhere(
  creator: FeedCreator,
  blockedUserIds: string[],
  scope: FeedScope,
): Prisma.RequestWhereInput {
  const maxFollowers = creator.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
  return {
    ...(scope === "forYou" && { niche: { in: creator.niches } }),
    // A request lists the languages it's made in; the creator's has to be
    // one of them. Onboarding doesn't ask for a language, so a creator who
    // hasn't set one yet isn't filtered by it.
    ...(creator.contentLanguage && { languages: { has: creator.contentLanguage } }),
    minFollowers: { lte: maxFollowers },
    status: "OPEN",
    // A suspended brand's requests are closed on suspension; this also
    // covers any that slip through (see /admin/users).
    startup: { userId: { notIn: blockedUserIds }, user: { suspendedAt: null } },
  };
}
