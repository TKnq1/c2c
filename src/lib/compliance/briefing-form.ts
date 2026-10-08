import type { BriefingInput } from "@/lib/compliance/briefing";
import type { UsageRightsType } from "@prisma/client";
import { parseEuroInput } from "@/lib/euro-input";

// A briefing form's fields as strings (a FormData turned into an object, or the form's state in the browser) turned into
// the BriefingInput the validator wants. The same code runs in the browser for live hints and on the server for the
// real check, so the two can never disagree about what a field means.

export type FormValues = Record<string, string | undefined>;

const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const words = (value: string | undefined) =>
  (value ?? "")
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const names = (value: string | undefined) =>
  (value ?? "")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const flag = (value: string | undefined) => value === "true" || value === "on";

function whole(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : Number.NaN;
}

function day(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const date = new Date(`${value.trim()}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// An amount the way a person in Germany types it ("250", "250,50", "1.250") as cents; null when empty or not an amount.
export function eurosToCents(value: string | undefined): number | null {
  const euros = parseEuroInput(value ?? "");
  if (!Number.isFinite(euros) || euros <= 0 || euros > 100_000) return null;
  return Math.round(euros * 100);
}

const text = (value: string | undefined) => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed.slice(0, 2000) : null;
};

export function parseBriefingForm(values: FormValues): BriefingInput {
  const usageType = (["ORGANIC_ONLY", "CROSS_POST", "PAID_ADS"] as const).includes(values.usageType as UsageRightsType)
    ? (values.usageType as UsageRightsType)
    : "ORGANIC_ONLY";
  return {
    targetMarket: (values.targetMarket ?? "DE").trim(),
    contentFormats: list(values.contentFormats),
    talkingPoints: text(values.talkingPoints),
    doNots: text(values.doNots),
    requiredHashtags: words(values.requiredHashtags).map((t) => t.replace(/^#/, "")),
    requiredMentions: words(values.requiredMentions).map((m) => m.replace(/^@/, "")),
    disclosureLabels: list(values.disclosureLabels),
    requirePaidPartnershipLabel: flag(values.requirePaidPartnershipLabel),
    draftRequired: flag(values.draftRequired),
    draftDueDaysBeforePost: whole(values.draftDueDaysBeforePost, 5),
    brandReviewDays: whole(values.brandReviewDays, 3),
    maxRevisionRounds: whole(values.maxRevisionRounds, 2),
    postingWindowStart: day(values.postingWindowStart),
    postingWindowEnd: day(values.postingWindowEnd),
    minLiveHours: whole(values.minLiveHours, 24),
    exclusivity: {
      enabled: flag(values.exclusivityEnabled),
      categories: list(values.exclusivityCategories),
      competitors: names(values.exclusivityCompetitors),
      daysBefore: whole(values.exclusivityDaysBefore, 0),
      daysAfter: whole(values.exclusivityDaysAfter, 0),
    },
    usage: {
      type: usageType,
      channels: list(values.usageChannels),
      durationDays: usageType === "ORGANIC_ONLY" ? null : (() => { const n = whole(values.usageDurationDays, 0); return n > 0 ? n : null; })(),
      feeCents: usageType === "ORGANIC_ONLY" ? null : eurosToCents(values.usageFeeEuros),
      territory: (values.usageTerritory ?? "EU").trim().slice(0, 40) || "EU",
    },
  };
}

const isoDay = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

// The other way round: a stored briefing as the strings the form starts from.
export function briefingToValues(input: BriefingInput): FormValues {
  return {
    targetMarket: input.targetMarket,
    contentFormats: input.contentFormats.join(","),
    talkingPoints: input.talkingPoints ?? "",
    doNots: input.doNots ?? "",
    requiredHashtags: input.requiredHashtags.join(" "),
    requiredMentions: input.requiredMentions.join(" "),
    disclosureLabels: input.disclosureLabels.join(","),
    requirePaidPartnershipLabel: String(input.requirePaidPartnershipLabel),
    draftRequired: String(input.draftRequired),
    draftDueDaysBeforePost: String(input.draftDueDaysBeforePost),
    brandReviewDays: String(input.brandReviewDays),
    maxRevisionRounds: String(input.maxRevisionRounds),
    postingWindowStart: isoDay(input.postingWindowStart),
    postingWindowEnd: isoDay(input.postingWindowEnd),
    minLiveHours: String(input.minLiveHours),
    exclusivityEnabled: String(input.exclusivity.enabled),
    exclusivityCategories: input.exclusivity.categories.join(","),
    exclusivityCompetitors: input.exclusivity.competitors.join("\n"),
    exclusivityDaysBefore: String(input.exclusivity.daysBefore),
    exclusivityDaysAfter: String(input.exclusivity.daysAfter),
    usageType: input.usage.type,
    usageChannels: input.usage.channels.join(","),
    usageDurationDays: input.usage.durationDays ? String(input.usage.durationDays) : "",
    usageFeeEuros: input.usage.feeCents ? String(input.usage.feeCents / 100).replace(".", ",") : "",
    usageTerritory: input.usage.territory,
  };
}
