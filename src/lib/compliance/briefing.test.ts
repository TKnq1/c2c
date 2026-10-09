import { describe, expect, it } from "vitest";
import { validateBriefing, type BriefingInput } from "@/lib/compliance/briefing";

const NOW = new Date("2026-10-08T10:00:00Z");

const valid: BriefingInput = {
  targetMarket: "DE",
  contentFormats: ["INSTAGRAM_REEL", "INSTAGRAM_STORY"],
  talkingPoints: "Zeige die Textur und nenne den Rabattcode.",
  doNots: "Keine Werbung für andere Marken im selben Video.",
  requiredHashtags: ["glowco"],
  requiredMentions: ["@glowco"],
  disclosureLabels: ["Werbung", "Anzeige"],
  requirePaidPartnershipLabel: true,
  draftRequired: true,
  draftDueDaysBeforePost: 5,
  brandReviewDays: 3,
  maxRevisionRounds: 2,
  postingWindowStart: new Date("2026-10-15"),
  postingWindowEnd: new Date("2026-10-30"),
  minLiveHours: 168,
  exclusivity: { enabled: false, categories: [], competitors: [], daysBefore: 0, daysAfter: 0 },
  usage: { type: "ORGANIC_ONLY", channels: [], durationDays: null, feeCents: null, territory: "EU" },
};

const codes = (input: BriefingInput, budgetMaxCents: number | null = 200_000) =>
  validateBriefing(input, { budgetMaxCents, now: NOW }).map((i) => `${i.severity}:${i.code}`);

describe("validateBriefing", () => {
  it("passes a complete German briefing", () => {
    expect(codes(valid)).toEqual([]);
  });

  it("needs at least one known format", () => {
    expect(codes({ ...valid, contentFormats: [] })).toContain("error:BRIEFING_FORMAT_REQUIRED");
    expect(codes({ ...valid, contentFormats: ["FACEBOOK_REEL"] })).toContain("error:BRIEFING_FORMAT_UNKNOWN");
  });

  it("makes the advertising label mandatory and refuses #ad as the only one", () => {
    expect(codes({ ...valid, disclosureLabels: [] })).toContain("error:DISCLOSURE_LABEL_REQUIRED");
    expect(codes({ ...valid, disclosureLabels: ["ad"] })).toContain("error:DISCLOSURE_LABEL_INSUFFICIENT");
    expect(codes({ ...valid, disclosureLabels: ["Liebe Grüße"] })).toContain("error:DISCLOSURE_LABEL_UNKNOWN");
  });

  it("refuses briefings that tell creators to hide the advertising", () => {
    expect(codes({ ...valid, doNots: "Bitte die Werbung nicht kennzeichnen" })).toContain("error:DISCLOSURE_INSTRUCTION_FORBIDDEN");
    expect(codes({ ...valid, talkingPoints: "Make it look like an organic post" })).toContain("error:DISCLOSURE_INSTRUCTION_FORBIDDEN");
  });

  it("recommends the platform label for German-speaking markets only", () => {
    expect(codes({ ...valid, requirePaidPartnershipLabel: false })).toContain("warning:PAID_PARTNERSHIP_LABEL_RECOMMENDED");
    expect(codes({ ...valid, targetMarket: "FR", disclosureLabels: ["Publicité"], requirePaidPartnershipLabel: false })).toEqual([]);
  });

  it("rejects malformed hashtags and mentions", () => {
    expect(codes({ ...valid, requiredHashtags: ["two words"] })).toContain("error:BRIEFING_HASHTAG_INVALID");
    expect(codes({ ...valid, requiredMentions: ["@no spaces"] })).toContain("error:BRIEFING_MENTION_INVALID");
  });

  it("checks the dates and the workflow numbers", () => {
    expect(codes({ ...valid, postingWindowEnd: new Date("2026-10-10") })).toContain("error:BRIEFING_WINDOW_INVALID");
    expect(codes({ ...valid, postingWindowEnd: new Date("2026-10-01"), postingWindowStart: null })).toContain("error:BRIEFING_WINDOW_PAST");
    expect(codes({ ...valid, minLiveHours: 12 })).toContain("error:BRIEFING_LIVE_HOURS_INVALID");
    expect(codes({ ...valid, brandReviewDays: 0 })).toContain("error:BRIEFING_WORKFLOW_RANGE");
  });

  it("requires a period for exclusivity and caps it", () => {
    const exclusive = { enabled: true, categories: ["Cosmetics"], competitors: [], daysBefore: 0, daysAfter: 0 };
    expect(codes({ ...valid, exclusivity: exclusive })).toContain("error:EXCLUSIVITY_DAYS_REQUIRED");
    expect(codes({ ...valid, exclusivity: { ...exclusive, daysAfter: 400 } })).toContain("error:EXCLUSIVITY_DAYS_TOO_LONG");
    expect(codes({ ...valid, exclusivity: { ...exclusive, daysAfter: 30 } })).toEqual([]);
    expect(codes({ ...valid, exclusivity: { ...exclusive, categories: [], daysAfter: 30 } })).toEqual(["warning:EXCLUSIVITY_SCOPE_REQUIRED"]);
  });

  it("requires channel, duration and a fee for paid usage, and keeps the fee inside the budget", () => {
    const paid = { type: "PAID_ADS" as const, channels: [], durationDays: null, feeCents: null, territory: "EU" };
    expect(codes({ ...valid, usage: paid })).toEqual([
      "error:USAGE_CHANNEL_REQUIRED",
      "error:USAGE_DURATION_REQUIRED",
      "error:USAGE_FEE_REQUIRED",
    ]);
    const ok = { ...paid, channels: ["TIKTOK_SPARK_ADS", "META_PARTNERSHIP_ADS"], durationDays: 60, feeCents: 50_000 };
    expect(codes({ ...valid, usage: ok })).toEqual([]);
    expect(codes({ ...valid, usage: { ...ok, feeCents: 300_000 } })).toContain("error:USAGE_FEE_EXCEEDS_BUDGET");
    expect(codes({ ...valid, usage: { ...ok, durationDays: 900 } })).toContain("error:USAGE_DURATION_TOO_LONG");
    expect(codes({ ...valid, usage: { ...ok, channels: ["BRAND_WEBSITE"] } })).toContain("error:USAGE_CHANNEL_NOT_ALLOWED");
  });

  it("lets cross-posting have a duration without a fee", () => {
    const cross = { type: "CROSS_POST" as const, channels: ["BRAND_ORGANIC_REPOST"], durationDays: 90, feeCents: null, territory: "EU" };
    expect(codes({ ...valid, usage: cross })).toEqual([]);
  });
});
