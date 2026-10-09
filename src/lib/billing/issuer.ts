import { DE_IMPRINT } from "@/lib/legal/de";

// A party as it is printed on an invoice. Stored with the invoice, so a later change of address never rewrites one.
export type InvoiceParty = {
  name: string;
  addressLines: string[];
  country: string;
  vatId: string | null;
  taxNumber: string | null;
};

// The platform as the issuer: name and address from the imprint (one source of truth), tax identification from the
// environment. Without a VAT ID or tax number no invoice may be issued (§ 14 Abs. 4 Nr. 2 UStG), so this is null.
export function platformIssuer(env: Record<string, string | undefined> = process.env): InvoiceParty | null {
  const lines = DE_IMPRINT.rows[0]?.lines ?? [];
  const [owner, , street, place] = lines;
  const vatId = env.IMPRINT_VAT_ID?.trim() || null;
  const taxNumber = env.PLATFORM_TAX_NUMBER?.trim() || null;
  if (!owner || !street || !place || (!vatId && !taxNumber)) return null;
  return {
    name: `${owner} (comtor)`,
    addressLines: [street, place.replace(/,\s*Deutschland$/, "")],
    country: "DE",
    vatId,
    taxNumber,
  };
}

// A platform that is itself a small business (§ 19 UStG) charges no VAT on its invoices.
export function platformIsSmallBusiness(env: Record<string, string | undefined> = process.env): boolean {
  return env.PLATFORM_SMALL_BUSINESS === "1";
}
