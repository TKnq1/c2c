import type { TaxTreatment, VatIdStatus } from "@prisma/client";
import { errorIssue, type Issue } from "@/lib/deals/issues";
import { isEuCountry } from "@/lib/tax/vat-id";

// VAT for a brand deal, from the platform's point of view (a German business, § 3a Abs. 2 UStG: services between
// businesses are taxed where the recipient sits).
//
// Two documents come out of a deal, and each has its own treatment:
//   1. The platform's invoice to the BRAND for the net deal price. German brand: 19 % on top. Brand in another EU
//      state with a VAT ID VIES confirms: reverse charge, no VAT. Brand outside the EU: not taxable in Germany.
//   2. The creator's service to the PLATFORM, billed by the platform as a self-billing credit note. German creator:
//      the payout includes 19 % VAT, unless the creator is a small business (§ 19 UStG). EU creator with a VAT ID:
//      reverse charge. Creator outside the EU: § 13b UStG.
//
// The payout the creator receives is fixed (Interest.payoutCents). Where the creator charges VAT it is carved out of
// that amount, so the money moving through Stripe never changes with the creator's tax status.
// Not tax advice: the rules below are the standard cases, and a tax adviser has the last word.

export const PLATFORM_COUNTRY = "DE";
export const DE_STANDARD_VAT_BP = 1900;

export type TaxParty = {
  country: string;
  vatId: string | null;
  vatIdStatus: VatIdStatus;
  smallBusinessExempt: boolean;
};

export type TaxDecision = { treatment: TaxTreatment; rateBp: number };
export type TaxResult<T> = { ok: true; value: T } | { ok: false; issues: Issue[] };

function vatIdBlock(party: TaxParty): Issue {
  // A number that was never checked, or whose check failed because VIES was down, is "not verified yet"; no number, or
  // one VIES rejected, is "required".
  if (party.vatId && (party.vatIdStatus === "UNCHECKED" || party.vatIdStatus === "UNAVAILABLE")) {
    return errorIssue("VAT_ID_NOT_VERIFIED", "vatId");
  }
  return errorIssue("VAT_ID_REQUIRED", "vatId");
}

export function brandTaxDecision(brand: TaxParty, platform: { smallBusiness: boolean }): TaxResult<TaxDecision> {
  const country = brand.country.toUpperCase();
  if (platform.smallBusiness) return { ok: true, value: { treatment: "SMALL_BUSINESS_EXEMPT", rateBp: 0 } };
  if (country === PLATFORM_COUNTRY) return { ok: true, value: { treatment: "DOMESTIC_VAT", rateBp: DE_STANDARD_VAT_BP } };
  if (isEuCountry(country)) {
    if (brand.vatId && brand.vatIdStatus === "VALID") return { ok: true, value: { treatment: "REVERSE_CHARGE_EU", rateBp: 0 } };
    return { ok: false, issues: [vatIdBlock(brand)] };
  }
  return { ok: true, value: { treatment: "OUT_OF_SCOPE", rateBp: 0 } };
}

export function creatorTaxDecision(creator: TaxParty): TaxResult<TaxDecision> {
  const country = creator.country.toUpperCase();
  if (country === PLATFORM_COUNTRY) {
    return creator.smallBusinessExempt
      ? { ok: true, value: { treatment: "SMALL_BUSINESS_EXEMPT", rateBp: 0 } }
      : { ok: true, value: { treatment: "DOMESTIC_VAT", rateBp: DE_STANDARD_VAT_BP } };
  }
  if (isEuCountry(country)) {
    if (creator.vatId && creator.vatIdStatus === "VALID") return { ok: true, value: { treatment: "REVERSE_CHARGE_EU", rateBp: 0 } };
    if (creator.smallBusinessExempt) return { ok: true, value: { treatment: "SMALL_BUSINESS_EXEMPT", rateBp: 0 } };
    return { ok: false, issues: [vatIdBlock(creator)] };
  }
  return { ok: true, value: { treatment: "REVERSE_CHARGE_13B", rateBp: 0 } };
}

// 19 % of a net amount, in whole cents.
export function vatOnNet(netCents: number, rateBp: number): number {
  return Math.round((netCents * rateBp) / 10_000);
}

// A gross amount that already contains VAT, split into net and VAT. net + vat is always exactly gross.
export function splitVatInclusive(grossCents: number, rateBp: number): { netCents: number; vatCents: number } {
  if (rateBp === 0) return { netCents: grossCents, vatCents: 0 };
  const netCents = Math.round((grossCents * 10_000) / (10_000 + rateBp));
  return { netCents, vatCents: grossCents - netCents };
}

export type DealTax = {
  brand: TaxDecision & { netCents: number; vatCents: number; totalCents: number };
  creator: TaxDecision & { grossCents: number; netCents: number; vatCents: number };
  // What the platform keeps before its own costs: the net price minus the creator's net payout.
  platformMarginNetCents: number;
};

export function computeDealTax(input: {
  amountCents: number;
  payoutCents: number;
  brand: TaxParty;
  creator: TaxParty;
  platform: { smallBusiness: boolean };
}): TaxResult<DealTax> {
  const brand = brandTaxDecision(input.brand, input.platform);
  const creator = creatorTaxDecision(input.creator);
  const issues: Issue[] = [];
  if (!brand.ok) issues.push(...brand.issues.map((i) => ({ ...i, field: `brand.${i.field ?? ""}` })));
  if (!creator.ok) issues.push(...creator.issues.map((i) => ({ ...i, field: `creator.${i.field ?? ""}` })));
  if (!brand.ok || !creator.ok) return { ok: false, issues };

  const brandVat = vatOnNet(input.amountCents, brand.value.rateBp);
  const creatorSplit = splitVatInclusive(input.payoutCents, creator.value.rateBp);
  return {
    ok: true,
    value: {
      brand: { ...brand.value, netCents: input.amountCents, vatCents: brandVat, totalCents: input.amountCents + brandVat },
      creator: { ...creator.value, grossCents: input.payoutCents, netCents: creatorSplit.netCents, vatCents: creatorSplit.vatCents },
      platformMarginNetCents: input.amountCents - creatorSplit.netCents,
    },
  };
}
