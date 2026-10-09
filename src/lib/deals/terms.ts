import { createHash } from "node:crypto";
import type { UsageRightsType } from "@prisma/client";
import { defaultFormatsForPlatform, isPostFormat, type PostFormat } from "@/lib/social/platforms";
import { MARKET_RULES, isMarket, type Market } from "@/lib/compliance/disclosure";
import { NO_EXCLUSIVITY, type ExclusivityTerms } from "@/lib/compliance/exclusivity";
import type { UsageTerms } from "@/lib/compliance/usage-rights";
import type { BriefingInput } from "@/lib/compliance/briefing";

// The contract: what both sides confirm, frozen when the offer is accepted. Later edits of the briefing never reach a
// deal that exists; the hash lets either side (and an admin) see that the terms they confirmed are the terms on file.

export const DEAL_TERMS_VERSION = 1;

export type DealTerms = {
  version: number;
  requestId: string;
  requestTitle: string;
  brandName: string;
  creatorName: string;
  productCategory: string;
  deliverables: string | null;
  // The price: net for the brand, as agreed in the chat. payout and fee are the split of it.
  amountCents: number;
  payoutCents: number;
  platformFeeCents: number;
  targetMarket: Market;
  contentFormats: PostFormat[];
  talkingPoints: string | null;
  doNots: string | null;
  requiredHashtags: string[];
  requiredMentions: string[];
  disclosure: { labels: string[]; requirePaidPartnershipLabel: boolean };
  workflow: {
    draftRequired: boolean;
    draftDueDaysBeforePost: number;
    brandReviewDays: number;
    maxRevisionRounds: number;
    // YYYY-MM-DD or null
    postingWindowStart: string | null;
    postingWindowEnd: string | null;
    minLiveHours: number;
  };
  exclusivity: ExclusivityTerms;
  usage: UsageTerms;
};

// A CampaignBriefing row, or the same shape built by the briefing form.
export type BriefingRow = {
  targetMarket: string;
  contentFormats: string[];
  talkingPoints: string | null;
  doNots: string | null;
  requiredHashtags: string[];
  requiredMentions: string[];
  disclosureLabels: string[];
  requirePaidPartnershipLabel: boolean;
  draftRequired: boolean;
  draftDueDaysBeforePost: number;
  brandReviewDays: number;
  maxRevisionRounds: number;
  postingWindowStart: Date | null;
  postingWindowEnd: Date | null;
  minLiveHours: number;
  exclusivityEnabled: boolean;
  exclusivityCategories: string[];
  exclusivityCompetitors: string[];
  exclusivityDaysBefore: number;
  exclusivityDaysAfter: number;
  usageType: UsageRightsType;
  usageChannels: string[];
  usageDurationDays: number | null;
  usageFeeCents: number | null;
  usageTerritory: string;
};

export function briefingRowToInput(row: BriefingRow): BriefingInput {
  return {
    targetMarket: row.targetMarket,
    contentFormats: row.contentFormats,
    talkingPoints: row.talkingPoints,
    doNots: row.doNots,
    requiredHashtags: row.requiredHashtags,
    requiredMentions: row.requiredMentions,
    disclosureLabels: row.disclosureLabels,
    requirePaidPartnershipLabel: row.requirePaidPartnershipLabel,
    draftRequired: row.draftRequired,
    draftDueDaysBeforePost: row.draftDueDaysBeforePost,
    brandReviewDays: row.brandReviewDays,
    maxRevisionRounds: row.maxRevisionRounds,
    postingWindowStart: row.postingWindowStart,
    postingWindowEnd: row.postingWindowEnd,
    minLiveHours: row.minLiveHours,
    exclusivity: {
      enabled: row.exclusivityEnabled,
      categories: row.exclusivityCategories,
      competitors: row.exclusivityCompetitors,
      daysBefore: row.exclusivityDaysBefore,
      daysAfter: row.exclusivityDaysAfter,
    },
    usage: {
      type: row.usageType,
      channels: row.usageChannels,
      durationDays: row.usageDurationDays,
      feeCents: row.usageFeeCents,
      territory: row.usageTerritory,
    },
  };
}

// For requests written before briefings existed: the German defaults, the one platform the request names, a draft round
// and a 24-hour hold. The brand can still write a full briefing before sending an offer.
// `market` starts the form in the brand's own market (its labels with it); contracts and deals always fall back to Germany.
export function defaultBriefingFor(request: { platform: string | null; postBy: Date | null }, market: Market = "DE"): BriefingInput {
  return {
    targetMarket: market,
    contentFormats: defaultFormatsForPlatform(request.platform),
    talkingPoints: null,
    doNots: null,
    requiredHashtags: [],
    requiredMentions: [],
    disclosureLabels: [...MARKET_RULES[market].accepted],
    requirePaidPartnershipLabel: true,
    draftRequired: true,
    draftDueDaysBeforePost: 5,
    brandReviewDays: 3,
    maxRevisionRounds: 2,
    postingWindowStart: null,
    postingWindowEnd: request.postBy,
    minLiveHours: 24,
    exclusivity: NO_EXCLUSIVITY,
    usage: { type: "ORGANIC_ONLY", channels: [], durationDays: null, feeCents: null, territory: "EU" },
  };
}

function isoDay(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export type TermsSource = {
  request: { id: string; title: string; productCategory: string; deliverables: string | null; platform: string | null; postBy: Date | null };
  briefing: BriefingInput;
  brandName: string;
  creatorName: string;
  amountCents: number;
  payoutCents: number;
  platformFeeCents: number;
};

export function buildTerms(src: TermsSource): DealTerms {
  const b = src.briefing;
  const market: Market = isMarket(b.targetMarket) ? b.targetMarket : "DE";
  return {
    version: DEAL_TERMS_VERSION,
    requestId: src.request.id,
    requestTitle: src.request.title,
    brandName: src.brandName,
    creatorName: src.creatorName,
    productCategory: src.request.productCategory,
    deliverables: src.request.deliverables,
    amountCents: src.amountCents,
    payoutCents: src.payoutCents,
    platformFeeCents: src.platformFeeCents,
    targetMarket: market,
    contentFormats: b.contentFormats.filter(isPostFormat),
    talkingPoints: b.talkingPoints,
    doNots: b.doNots,
    requiredHashtags: b.requiredHashtags,
    requiredMentions: b.requiredMentions,
    disclosure: { labels: b.disclosureLabels, requirePaidPartnershipLabel: b.requirePaidPartnershipLabel },
    workflow: {
      draftRequired: b.draftRequired,
      draftDueDaysBeforePost: b.draftDueDaysBeforePost,
      brandReviewDays: b.brandReviewDays,
      maxRevisionRounds: b.maxRevisionRounds,
      postingWindowStart: isoDay(b.postingWindowStart),
      postingWindowEnd: isoDay(b.postingWindowEnd),
      minLiveHours: b.minLiveHours,
    },
    exclusivity: b.exclusivity,
    usage: b.usage,
  };
}

// Same content, same bytes: keys sorted, so the hash does not depend on the order fields were written in.
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

export function termsHash(terms: DealTerms): string {
  return createHash("sha256").update(canonicalJson(terms)).digest("hex");
}

// Terms read back from the JSON column. Anything that does not look like terms is refused rather than guessed at.
export function parseTerms(json: unknown): DealTerms {
  if (!json || typeof json !== "object" || (json as { version?: unknown }).version !== DEAL_TERMS_VERSION) {
    throw new Error("Deal terms are missing or from an unknown version.");
  }
  return json as DealTerms;
}
