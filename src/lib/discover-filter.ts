// The brand's Discover filters, kept pure so the rules are tested without rendering: the follower steps, how many filter
// groups are on (the badge on the Filter button), the filters an open request stands for, and why a creator fits one.

export const FOLLOWER_STEPS = [0, 1000, 10_000, 100_000] as const;

export type DiscoverFilters = { niche: string; platform: string; language: string; minFollowers: string };

// An open request of the brand, as Discover reads it: what it asks for, and which creators it already has a chat with.
export type DiscoverRequest = {
  id: string;
  title: string;
  niche: string;
  languages: string[];
  minFollowers: number;
  platforms: string[];
  // creatorId -> interestId
  chats: Record<string, string>;
};

export type MatchReason = "niche" | "platform" | "reach" | "language";

type CreatorFacts = { niches: string[]; platforms: { platform: string; followerCount: number }[]; contentLanguage: string | null };

export function splitList(value: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

// How many filter groups narrow the list (search, sorting and favorites not counted).
export function activeFilterCount(filters: DiscoverFilters): number {
  return [filters.niche, filters.platform, filters.language].filter((v) => splitList(v).length > 0).length + (Number(filters.minFollowers) > 0 ? 1 : 0);
}

// Picking a request sets the filters to what it asks for; each can be taken off again.
export function filtersForRequest(request: DiscoverRequest): DiscoverFilters {
  return {
    niche: request.niche,
    platform: request.platforms.join(","),
    language: request.languages.join(","),
    minFollowers: request.minFollowers > 0 ? String(request.minFollowers) : "",
  };
}

// What a creator brings that the request asks for, in a fixed order.
export function matchReasons(creator: CreatorFacts, request: DiscoverRequest): MatchReason[] {
  const reach = creator.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
  const reasons: MatchReason[] = [];
  if (creator.niches.includes(request.niche)) reasons.push("niche");
  if (request.platforms.length > 0 && creator.platforms.some((p) => request.platforms.includes(p.platform))) reasons.push("platform");
  if (request.minFollowers > 0 && reach >= request.minFollowers) reasons.push("reach");
  if (creator.contentLanguage && request.languages.includes(creator.contentLanguage)) reasons.push("language");
  return reasons;
}
