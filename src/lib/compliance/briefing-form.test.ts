import { describe, expect, it } from "vitest";
import { BRIEFING_FORM_KEYS, briefingToValues, cleanFormValues, eurosToCents, parseBriefingForm, withoutWindow } from "@/lib/compliance/briefing-form";
import { defaultBriefingFor } from "@/lib/deals/terms";
import { validateBriefing } from "@/lib/compliance/briefing";

describe("eurosToCents", () => {
  it("reads German and plain amounts", () => {
    expect(eurosToCents("250")).toBe(25_000);
    expect(eurosToCents("250,50")).toBe(25_050);
    expect(eurosToCents("1.250")).toBe(125_000);
    expect(eurosToCents("")).toBeNull();
    expect(eurosToCents("abc")).toBeNull();
    expect(eurosToCents("0")).toBeNull();
    expect(eurosToCents("-5")).toBeNull();
  });
});

describe("parseBriefingForm", () => {
  const form = {
    targetMarket: "DE",
    contentFormats: "INSTAGRAM_REEL,TIKTOK_VIDEO",
    talkingPoints: "  Textur zeigen  ",
    requiredHashtags: "#glowco, herbst",
    requiredMentions: "@glowco",
    disclosureLabels: "Werbung,Anzeige",
    requirePaidPartnershipLabel: "true",
    draftRequired: "true",
    draftDueDaysBeforePost: "5",
    brandReviewDays: "3",
    maxRevisionRounds: "2",
    postingWindowStart: "2026-10-15",
    postingWindowEnd: "2026-10-30",
    minLiveHours: "168",
    exclusivityEnabled: "true",
    exclusivityCategories: "Cosmetics",
    exclusivityCompetitors: "Rival GmbH\nOther Co",
    exclusivityDaysBefore: "7",
    exclusivityDaysAfter: "30",
    usageType: "PAID_ADS",
    usageChannels: "TIKTOK_SPARK_ADS,META_PARTNERSHIP_ADS",
    usageDurationDays: "60",
    usageFeeEuros: "400",
  };

  it("turns the form into a briefing", () => {
    const input = parseBriefingForm(form);
    expect(input).toMatchObject({
      contentFormats: ["INSTAGRAM_REEL", "TIKTOK_VIDEO"],
      talkingPoints: "Textur zeigen",
      requiredHashtags: ["glowco", "herbst"],
      requiredMentions: ["glowco"],
      disclosureLabels: ["Werbung", "Anzeige"],
      requirePaidPartnershipLabel: true,
      minLiveHours: 168,
      exclusivity: { enabled: true, categories: ["Cosmetics"], competitors: ["Rival GmbH", "Other Co"], daysBefore: 7, daysAfter: 30 },
      usage: { type: "PAID_ADS", channels: ["TIKTOK_SPARK_ADS", "META_PARTNERSHIP_ADS"], durationDays: 60, feeCents: 40_000 },
    });
    expect(input.postingWindowStart?.toISOString()).toBe("2026-10-15T00:00:00.000Z");
  });

  it("makes the result pass the validator when the form is right", () => {
    const issues = validateBriefing(parseBriefingForm(form), { budgetMaxCents: 100_000, now: new Date("2026-10-08") });
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("falls back to safe defaults for an empty form, which the validator then refuses for the missing parts", () => {
    const input = parseBriefingForm({});
    expect(input).toMatchObject({ targetMarket: "DE", contentFormats: [], draftRequired: false, minLiveHours: 24, usage: { type: "ORGANIC_ONLY" } });
    const codes = validateBriefing(input, { budgetMaxCents: null, now: new Date("2026-10-08") }).map((i) => i.code);
    expect(codes).toContain("BRIEFING_FORMAT_REQUIRED");
    expect(codes).toContain("DISCLOSURE_LABEL_REQUIRED");
  });

  it("drops usage details for organic-only briefings and turns garbage numbers into NaN the validator refuses", () => {
    expect(parseBriefingForm({ usageType: "ORGANIC_ONLY", usageDurationDays: "60", usageFeeEuros: "400" }).usage).toMatchObject({ durationDays: null, feeCents: null });
    const codes = validateBriefing(parseBriefingForm({ ...form, brandReviewDays: "soon" }), { budgetMaxCents: null, now: new Date("2026-10-08") }).map((i) => i.code);
    expect(codes).toContain("BRIEFING_WORKFLOW_RANGE");
  });
});

describe("briefingToValues", () => {
  it("round-trips: what the form shows parses back to the same briefing", () => {
    const original = parseBriefingForm({
      targetMarket: "AT",
      contentFormats: "INSTAGRAM_REEL,INSTAGRAM_STORY",
      talkingPoints: "Textur zeigen",
      requiredHashtags: "glowco herbst",
      requiredMentions: "glowco",
      disclosureLabels: "Werbung",
      requirePaidPartnershipLabel: "true",
      draftRequired: "true",
      draftDueDaysBeforePost: "7",
      brandReviewDays: "4",
      maxRevisionRounds: "1",
      postingWindowStart: "2026-10-15",
      postingWindowEnd: "2026-10-30",
      minLiveHours: "720",
      exclusivityEnabled: "true",
      exclusivityCategories: "Cosmetics,Supplements",
      exclusivityCompetitors: "Rival GmbH\nOther Co",
      exclusivityDaysBefore: "7",
      exclusivityDaysAfter: "30",
      usageType: "PAID_ADS",
      usageChannels: "TIKTOK_SPARK_ADS",
      usageDurationDays: "60",
      usageFeeEuros: "400,50",
      usageTerritory: "EU",
    });
    expect(parseBriefingForm(briefingToValues(original))).toEqual(original);
  });
});

describe("form values from outside", () => {
  it("lists exactly the fields briefingToValues writes", () => {
    const values = briefingToValues(defaultBriefingFor({ platform: "TikTok", postBy: null }));
    expect([...BRIEFING_FORM_KEYS].sort()).toEqual(Object.keys(values).sort());
  });

  it("keeps known fields as strings and nothing else", () => {
    const clean = cleanFormValues({ targetMarket: "DE", minLiveHours: 24, evil: "x", talkingPoints: "a".repeat(9000), usageType: null });
    expect(Object.keys(clean).sort()).toEqual(["talkingPoints", "targetMarket"]);
    expect(clean.talkingPoints).toHaveLength(4000);
  });

  it("copes with values that are not an object", () => {
    expect(cleanFormValues(null)).toEqual({});
    expect(cleanFormValues("x")).toEqual({});
    expect(cleanFormValues(undefined)).toEqual({});
  });

  it("drops the posting window", () => {
    const values = { targetMarket: "DE", postingWindowStart: "2026-11-01", postingWindowEnd: "2026-12-01" };
    expect(withoutWindow(values)).toEqual({ targetMarket: "DE" });
  });
});
