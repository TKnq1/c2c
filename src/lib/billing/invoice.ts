import type { InvoiceKind, TaxTreatment } from "@prisma/client";
import { POST_FORMATS, type PostFormat } from "@/lib/social/platforms";
import { USAGE_CHANNELS, isUsageChannel, type UsageTerms } from "@/lib/compliance/usage-rights";
import { splitVatInclusive, type DealTax } from "@/lib/tax/engine";
import type { InvoiceParty } from "@/lib/billing/issuer";

// The two documents a finished deal produces. Built as plain data first (this file), then numbered and stored in one
// transaction (issue.ts). The platform is German, so the documents are in German.

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitNetCents: number;
  netCents: number;
};

export type InvoiceDraft = {
  kind: InvoiceKind;
  issuer: InvoiceParty;
  recipient: InvoiceParty;
  lines: InvoiceLine[];
  netCents: number;
  vatCents: number;
  grossCents: number;
  vatRateBp: number;
  taxTreatment: TaxTreatment;
  legalNote: string | null;
  notes: string[];
  servicePeriod: { start: Date; end: Date };
  dealId: string;
};

const NUMBER_PREFIX: Record<InvoiceKind, string> = { BRAND_INVOICE: "RE", CREATOR_CREDIT_NOTE: "GS" };

export function invoiceSequenceKey(kind: InvoiceKind, year: number): string {
  return `${NUMBER_PREFIX[kind]}-${year}`;
}

export function formatInvoiceNumber(kind: InvoiceKind, year: number, sequence: number): string {
  return `${invoiceSequenceKey(kind, year)}-${String(sequence).padStart(6, "0")}`;
}

// The wording that must stand on the document for the treatment (§ 14 Abs. 4 UStG; Art. 226 VAT Directive).
export function legalNoteFor(treatment: TaxTreatment, supplierCountry: string): string | null {
  switch (treatment) {
    case "DOMESTIC_VAT":
      return null;
    case "REVERSE_CHARGE_EU":
      return "Steuerschuldnerschaft des Leistungsempfängers (Reverse-Charge-Verfahren, Art. 196 MwStSystRL). Sonstige Leistung, die nicht im Inland steuerbar ist (§ 3a Abs. 2 UStG).";
    case "REVERSE_CHARGE_13B":
      return "Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG.";
    case "OUT_OF_SCOPE":
      return "Nicht im Inland steuerbare sonstige Leistung (§ 3a Abs. 2 UStG). Der Leistungsempfänger schuldet die Steuer in seinem Land.";
    case "SMALL_BUSINESS_EXEMPT":
      return supplierCountry.toUpperCase() === "DE"
        ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung)."
        : "Keine Umsatzsteuer berechnet: Kleinunternehmerregelung des Niederlassungsstaats (Art. 281 ff. MwStSystRL).";
  }
}

export type DealDocumentInput = {
  dealId: string;
  requestTitle: string;
  contentFormats: string[];
  usage: UsageTerms;
  amountCents: number;
  payoutCents: number;
  usageFeeCents: number;
  tax: DealTax;
  platform: InvoiceParty;
  brand: InvoiceParty;
  creator: InvoiceParty;
  servicePeriod: { start: Date; end: Date };
};

function formatsText(formats: string[]): string {
  const labels = formats.map((f) => (f in POST_FORMATS ? POST_FORMATS[f as PostFormat].label : f));
  return labels.length ? labels.join(", ") : "Content-Beitrag";
}

function usageText(usage: UsageTerms): string {
  const channels = usage.channels.map((c) => (isUsageChannel(c) ? USAGE_CHANNELS[c].label : c)).join(", ");
  const days = usage.durationDays ? `${usage.durationDays} Tage` : "zeitlich begrenzt";
  return `Nutzungsrechte (${usage.type === "PAID_ADS" ? "Paid Ads" : "Cross-Posting"}, ${days}${channels ? `, ${channels}` : ""}, ${usage.territory})`;
}

// The line items for a total: the content, and the usage rights as their own line when they were priced.
function linesFor(
  input: DealDocumentInput,
  contentNetCents: number,
  usageNetCents: number,
): InvoiceLine[] {
  const lines: InvoiceLine[] = [
    {
      description: `Influencer-Kooperation „${input.requestTitle}“: ${formatsText(input.contentFormats)}`,
      quantity: 1,
      unitNetCents: contentNetCents,
      netCents: contentNetCents,
    },
  ];
  if (usageNetCents > 0) {
    lines.push({ description: usageText(input.usage), quantity: 1, unitNetCents: usageNetCents, netCents: usageNetCents });
  }
  return lines;
}

// Platform to brand: the net deal price, VAT on top where German VAT applies.
export function buildBrandInvoice(input: DealDocumentInput): InvoiceDraft {
  const usageNet = Math.min(Math.max(input.usageFeeCents, 0), input.amountCents);
  const { brand } = input.tax;
  return {
    kind: "BRAND_INVOICE",
    issuer: input.platform,
    recipient: input.brand,
    lines: linesFor(input, input.amountCents - usageNet, usageNet),
    netCents: brand.netCents,
    vatCents: brand.vatCents,
    grossCents: brand.totalCents,
    vatRateBp: brand.rateBp,
    taxTreatment: brand.treatment,
    legalNote: legalNoteFor(brand.treatment, input.platform.country),
    notes: [],
    servicePeriod: input.servicePeriod,
    dealId: input.dealId,
  };
}

// Creator to platform, billed by the platform in the creator's name (Gutschriftsverfahren, § 14 Abs. 2 UStG). The
// payout is what the creator receives; VAT, where the creator charges it, is inside it.
export function buildCreatorCreditNote(input: DealDocumentInput): InvoiceDraft {
  const { creator } = input.tax;
  const usageShareGross = input.amountCents > 0 ? Math.round((input.payoutCents * Math.min(input.usageFeeCents, input.amountCents)) / input.amountCents) : 0;
  const usageNet = splitVatInclusive(usageShareGross, creator.rateBp).netCents;
  return {
    kind: "CREATOR_CREDIT_NOTE",
    issuer: input.creator,
    recipient: input.platform,
    lines: linesFor(input, creator.netCents - usageNet, usageNet),
    netCents: creator.netCents,
    vatCents: creator.vatCents,
    grossCents: creator.grossCents,
    vatRateBp: creator.rateBp,
    taxTreatment: creator.treatment,
    legalNote: legalNoteFor(creator.treatment, input.creator.country),
    notes: [
      "Gutschrift im Sinne von § 14 Abs. 2 Satz 2 UStG, ausgestellt im Namen und für Rechnung des Leistenden auf Grundlage der vereinbarten Gutschriftsvereinbarung.",
      "Die Auszahlung des Betrags erfolgt über Stripe Connect auf das hinterlegte Konto.",
    ],
    servicePeriod: input.servicePeriod,
    dealId: input.dealId,
  };
}

// Net plus VAT is gross, and the lines add up to net: the invariants an issued document must keep.
export function documentIsConsistent(draft: InvoiceDraft): boolean {
  const lineSum = draft.lines.reduce((sum, line) => sum + line.netCents, 0);
  return draft.netCents + draft.vatCents === draft.grossCents && lineSum === draft.netCents && draft.lines.every((l) => l.netCents >= 0);
}
