import { describe, expect, it } from "vitest";
import type { CampaignBriefing } from "@prisma/client";
import { defaultBriefingFor } from "@/lib/deals/terms";
import { briefingData, isOfferStale, sameBriefing } from "@/lib/deals/briefing-store";

const input = () => defaultBriefingFor({ platform: "TikTok", postBy: null });

function rowFrom(data: ReturnType<typeof briefingData>): CampaignBriefing {
  return { id: "b1", requestId: "r1", version: 3, createdAt: new Date(), updatedAt: new Date(), ...data };
}

describe("briefing versions", () => {
  it("sees a save that changes nothing as the same briefing", () => {
    expect(sameBriefing(rowFrom(briefingData(input())), briefingData(input()))).toBe(true);
  });

  it("sees a changed rule", () => {
    const row = rowFrom(briefingData(input()));
    const changed = input();
    changed.minLiveHours = 168;
    expect(sameBriefing(row, briefingData(changed))).toBe(false);
  });

  it("sees a changed list, a changed order and a changed date", () => {
    const base = input();
    const row = rowFrom(briefingData({ ...base, requiredHashtags: ["a", "b"], postingWindowEnd: new Date("2026-12-01T00:00:00Z") }));
    expect(sameBriefing(row, briefingData({ ...base, requiredHashtags: ["a", "b"], postingWindowEnd: new Date("2026-12-01T00:00:00Z") }))).toBe(true);
    expect(sameBriefing(row, briefingData({ ...base, requiredHashtags: ["b", "a"], postingWindowEnd: new Date("2026-12-01T00:00:00Z") }))).toBe(false);
    expect(sameBriefing(row, briefingData({ ...base, requiredHashtags: ["a", "b"], postingWindowEnd: new Date("2026-12-02T00:00:00Z") }))).toBe(false);
  });

  it("does not mix up an empty text with a missing one", () => {
    const base = input();
    const row = rowFrom(briefingData({ ...base, talkingPoints: null }));
    expect(sameBriefing(row, briefingData({ ...base, talkingPoints: null }))).toBe(true);
    expect(sameBriefing(row, briefingData({ ...base, talkingPoints: "Show the texture." }))).toBe(false);
  });

  it("holds an offer back only when it was made under another version", () => {
    expect(isOfferStale(2, 2)).toBe(false);
    expect(isOfferStale(2, 3)).toBe(true);
    expect(isOfferStale(0, 1)).toBe(true);
    // An offer from before deals has no version: nothing to compare.
    expect(isOfferStale(null, 5)).toBe(false);
    expect(isOfferStale(undefined, 5)).toBe(false);
  });
});
