import { describe, expect, it } from "vitest";
import { activeFilterCount, filtersForRequest, matchReasons, splitList, type DiscoverRequest } from "@/lib/discover-filter";

const request: DiscoverRequest = {
  id: "r1",
  title: "Autumn routine",
  niche: "Beauty",
  languages: ["German"],
  minFollowers: 3000,
  platforms: ["TikTok"],
  chats: {},
};

describe("Discover filters", () => {
  it("counts the filter groups that are on", () => {
    expect(activeFilterCount({ niche: "", platform: "", language: "", minFollowers: "" })).toBe(0);
    expect(activeFilterCount({ niche: "Beauty,Food", platform: "TikTok", language: "", minFollowers: "0" })).toBe(2);
    expect(activeFilterCount({ niche: "", platform: "", language: "German", minFollowers: "10000" })).toBe(2);
  });

  it("turns a request into the filters it asks for", () => {
    expect(filtersForRequest(request)).toEqual({ niche: "Beauty", platform: "TikTok", language: "German", minFollowers: "3000" });
    expect(filtersForRequest({ ...request, minFollowers: 0, platforms: [] }).minFollowers).toBe("");
  });

  it("names what a creator brings to the request", () => {
    const fits = { niches: ["Beauty"], platforms: [{ platform: "TikTok", followerCount: 5000 }], contentLanguage: "German" };
    expect(matchReasons(fits, request)).toEqual(["niche", "platform", "reach", "language"]);
    const partly = { niches: ["Food"], platforms: [{ platform: "Instagram", followerCount: 1000 }], contentLanguage: "English" };
    expect(matchReasons(partly, request)).toEqual([]);
  });

  it("splits a list from the address without empty entries", () => {
    expect(splitList("")).toEqual([]);
    expect(splitList("Beauty,,Food")).toEqual(["Beauty", "Food"]);
  });
});
