import type { CampaignBriefing } from "@prisma/client";
import type { BriefingInput } from "@/lib/compliance/briefing";
import { prisma } from "@/lib/prisma";
import { isPostFormat } from "@/lib/social/platforms";

// Writing a request's campaign briefing. Every way of saving one (the builder, a template applied to many requests, a
// copy) goes through saveBriefing, so the version below moves the same way for all of them.

// The columns of a briefing as they are stored.
export function briefingData(input: BriefingInput) {
  return {
    targetMarket: input.targetMarket,
    contentFormats: input.contentFormats.filter(isPostFormat),
    talkingPoints: input.talkingPoints,
    doNots: input.doNots,
    requiredHashtags: input.requiredHashtags,
    requiredMentions: input.requiredMentions,
    disclosureLabels: input.disclosureLabels,
    requirePaidPartnershipLabel: input.requirePaidPartnershipLabel,
    draftRequired: input.draftRequired,
    draftDueDaysBeforePost: input.draftDueDaysBeforePost,
    brandReviewDays: input.brandReviewDays,
    maxRevisionRounds: input.maxRevisionRounds,
    postingWindowStart: input.postingWindowStart,
    postingWindowEnd: input.postingWindowEnd,
    minLiveHours: input.minLiveHours,
    exclusivityEnabled: input.exclusivity.enabled,
    exclusivityCategories: input.exclusivity.enabled ? input.exclusivity.categories : [],
    exclusivityCompetitors: input.exclusivity.enabled ? input.exclusivity.competitors : [],
    exclusivityDaysBefore: input.exclusivity.enabled ? input.exclusivity.daysBefore : 0,
    exclusivityDaysAfter: input.exclusivity.enabled ? input.exclusivity.daysAfter : 0,
    usageType: input.usage.type,
    usageChannels: input.usage.type === "ORGANIC_ONLY" ? [] : input.usage.channels,
    usageDurationDays: input.usage.durationDays,
    usageFeeCents: input.usage.feeCents,
    usageTerritory: input.usage.territory,
  };
}

export type BriefingData = ReturnType<typeof briefingData>;

const day = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : null);

function same(a: unknown, b: unknown): boolean {
  if (a instanceof Date || b instanceof Date) return day((a ?? null) as Date | null) === day((b ?? null) as Date | null);
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, i) => value === b[i]);
  }
  return (a ?? null) === (b ?? null);
}

// Whether saving `data` would change the rules the row already holds.
export function sameBriefing(row: CampaignBriefing, data: BriefingData): boolean {
  return (Object.keys(data) as (keyof BriefingData)[]).every((key) => same(row[key], data[key]));
}

// An offer is made under a version of the briefing (0: the request has none, so the defaults apply). Accepting it is only
// allowed while that version is still the current one. An offer from before deals (null) has no version to compare.
export function isOfferStale(offerVersion: number | null | undefined, currentVersion: number): boolean {
  return offerVersion !== null && offerVersion !== undefined && offerVersion !== currentVersion;
}

export type SavedBriefing = {
  version: number;
  changed: boolean;
  // Open offers that were made under an older version: they have to be confirmed again before they can be accepted.
  staleOffers: number;
};

// Stores the briefing of a request. The version goes up only when the rules really changed, so saving the same thing twice
// does not put the offers that were made under it on hold.
export async function saveBriefing(requestId: string, input: BriefingInput): Promise<SavedBriefing> {
  const data = briefingData(input);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.campaignBriefing.findUnique({ where: { requestId } });
    const changed = !existing || !sameBriefing(existing, data);
    let version = existing?.version ?? 1;
    if (changed) {
      const row = await tx.campaignBriefing.upsert({
        where: { requestId },
        create: { requestId, ...data, version: 1 },
        update: { ...data, version: { increment: 1 } },
      });
      version = row.version;
    }
    // The request's "post by" date follows the briefing's window, so the feed and the deal never show two dates.
    if (input.postingWindowEnd) await tx.request.update({ where: { id: requestId }, data: { postBy: input.postingWindowEnd } });
    const staleOffers = await tx.interest.count({
      where: { requestId, paymentStatus: "OFFERED", offerBriefingVersion: { not: null }, NOT: { offerBriefingVersion: version } },
    });
    return { version, changed, staleOffers };
  });
}
