// A contract as the tests of the contract lines and the contract PDF need it. Not part of the app.
import type { InvoiceParty } from "@/lib/billing/issuer";
import type { TaxSnapshot } from "@/lib/deals/parties";
import type { DealTerms } from "@/lib/deals/terms";

export const brandParty: InvoiceParty = { name: "Glow Cosmetics GmbH", addressLines: ["Teststraße 1", "10115 Berlin"], country: "DE", vatId: null, taxNumber: "12/345/67890" };
export const creatorParty: InvoiceParty = { name: "Mia Summers", addressLines: ["Linienstraße 5", "10119 Berlin"], country: "DE", vatId: null, taxNumber: "98/765/43210" };

export function termsFixture(over: Partial<DealTerms> = {}): DealTerms {
  return {
    version: 1,
    requestId: "req_1",
    requestTitle: "Autumn launch",
    brandName: "Glow",
    creatorName: "Mia",
    productCategory: "Cosmetics",
    deliverables: "1 TikTok video",
    amountCents: 100_000,
    payoutCents: 90_000,
    platformFeeCents: 10_000,
    targetMarket: "DE",
    contentFormats: ["TIKTOK_VIDEO"],
    talkingPoints: "Show the texture and mention the code GLOW10.",
    doNots: "No claims about medical effects.",
    requiredHashtags: ["glowco", "herbst"],
    requiredMentions: ["glowco"],
    disclosure: { labels: ["Werbung", "Anzeige"], requirePaidPartnershipLabel: true },
    workflow: { draftRequired: true, draftDueDaysBeforePost: 5, brandReviewDays: 3, maxRevisionRounds: 2, postingWindowStart: "2026-10-20", postingWindowEnd: "2026-11-20", minLiveHours: 24 },
    exclusivity: { enabled: false, categories: [], competitors: [], daysBefore: 0, daysAfter: 0 },
    usage: { type: "ORGANIC_ONLY", channels: [], durationDays: null, feeCents: null, territory: "EU" },
    ...over,
  };
}

export function snapshotFixture(): TaxSnapshot {
  return {
    version: 1,
    computedAt: "2026-10-08T10:00:00.000Z",
    tax: {
      brand: { treatment: "DOMESTIC_VAT", rateBp: 1900, netCents: 100_000, vatCents: 19_000, totalCents: 119_000 },
      creator: { treatment: "SMALL_BUSINESS_EXEMPT", rateBp: 0, grossCents: 90_000, netCents: 90_000, vatCents: 0 },
      platformMarginNetCents: 10_000,
    } as TaxSnapshot["tax"],
    brand: brandParty,
    creator: creatorParty,
    brandConsultationNumber: null,
    creatorConsultationNumber: null,
  };
}
