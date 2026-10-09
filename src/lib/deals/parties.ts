import type { BusinessProfile } from "@prisma/client";
import type { InvoiceParty } from "@/lib/billing/issuer";
import type { DealTax, TaxParty } from "@/lib/tax/engine";

export function toTaxParty(profile: Pick<BusinessProfile, "country" | "vatId" | "vatIdStatus" | "smallBusinessExempt">): TaxParty {
  return {
    country: profile.country,
    vatId: profile.vatId,
    vatIdStatus: profile.vatId ? profile.vatIdStatus : "UNCHECKED",
    smallBusinessExempt: profile.smallBusinessExempt,
  };
}

export function toInvoiceParty(
  profile: Pick<BusinessProfile, "legalName" | "addressLine1" | "addressLine2" | "postalCode" | "city" | "country" | "vatId" | "taxNumber">,
): InvoiceParty {
  return {
    name: profile.legalName,
    addressLines: [profile.addressLine1, profile.addressLine2, `${profile.postalCode} ${profile.city}`].filter((line): line is string => Boolean(line?.trim())),
    country: profile.country.toUpperCase(),
    vatId: profile.vatId,
    taxNumber: profile.taxNumber,
  };
}

// Frozen when both sides have signed (Deal.taxSnapshot): the VAT treatment, and the parties exactly as they were then,
// so an invoice issued weeks later describes the contract that was made.
export type TaxSnapshot = {
  version: 1;
  computedAt: string;
  tax: DealTax;
  brand: InvoiceParty;
  creator: InvoiceParty;
  brandConsultationNumber: string | null;
  creatorConsultationNumber: string | null;
};

export function parseTaxSnapshot(json: unknown): TaxSnapshot | null {
  if (!json || typeof json !== "object" || (json as { version?: unknown }).version !== 1) return null;
  return json as TaxSnapshot;
}
