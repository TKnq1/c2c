import { describe, expect, it } from "vitest";
import { creatorFeedWhere, parseFeedScope } from "@/lib/feed-scope";

const creator = {
  niches: ["Beauty", "Fitness"],
  platforms: [{ followerCount: 3_000 }, { followerCount: 12_000 }],
};

describe("parseFeedScope", () => {
  it("opens All only for ?feed=all", () => {
    expect(parseFeedScope("all")).toBe("all");
  });

  it("falls back to For you for anything else", () => {
    expect(parseFeedScope(undefined)).toBe("forYou");
    expect(parseFeedScope("forYou")).toBe("forYou");
    expect(parseFeedScope("ALL")).toBe("forYou");
    expect(parseFeedScope(["all", "all"])).toBe("forYou");
  });
});

describe("creatorFeedWhere", () => {
  it("For you keeps to the creator's niches", () => {
    expect(creatorFeedWhere(creator, [], "forYou").niche).toEqual({ in: ["Beauty", "Fitness"] });
  });

  it("All ignores the niches", () => {
    expect(creatorFeedWhere(creator, [], "all")).not.toHaveProperty("niche");
  });

  it("checks the follower threshold against the largest platform in both", () => {
    for (const scope of ["forYou", "all"] as const) {
      expect(creatorFeedWhere(creator, [], scope).minFollowers).toEqual({ lte: 12_000 });
    }
  });

  it("keeps blocks, suspensions and the open status in both", () => {
    for (const scope of ["forYou", "all"] as const) {
      const where = creatorFeedWhere(creator, ["blocked-user"], scope);
      expect(where.status).toBe("OPEN");
      expect(where.startup).toEqual({ userId: { notIn: ["blocked-user"] }, user: { suspendedAt: null } });
    }
  });

  it("shows nothing in For you without niches, but still something in All", () => {
    const none = { ...creator, niches: [] };
    expect(creatorFeedWhere(none, [], "forYou").niche).toEqual({ in: [] });
    expect(creatorFeedWhere(none, [], "all")).not.toHaveProperty("niche");
  });
});
