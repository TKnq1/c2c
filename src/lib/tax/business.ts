import type { Role, VatIdStatus } from "@prisma/client";
import { errorIssue, type Issue } from "@/lib/deals/issues";
import { isEuCountry, parseVatId, vatPrefixFor } from "@/lib/tax/vat-id";

// The business data every brand and creator gives before a deal can be signed. It serves three purposes at once: the
// traceability of traders on a platform (DSA Art. 30 / P2B Regulation), the data the invoices must show (§ 14 UStG),
// and the VAT treatment (tax/engine.ts). Private persons are not accepted: deals are business to business.

export const BUSINESS_TYPES = ["COMPANY", "SOLE_PROPRIETOR", "FREELANCER"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export function isBusinessType(value: string): value is BusinessType {
  return (BUSINESS_TYPES as readonly string[]).includes(value);
}

// Bumped with every change of the confirmation texts, so each acceptance names the wording it was given for.
export const TRADER_CERT_VERSION = "2026-10";
export const SELF_BILLING_VERSION = "2026-10";

export type BusinessInput = {
  legalName: string;
  businessType: string;
  country: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  phone: string | null;
  registerNumber: string | null;
  taxNumber: string | null;
  vatId: string | null;
  smallBusinessExempt: boolean;
  traderSelfCertified: boolean;
  selfBillingAccepted: boolean;
};

export function validateBusinessInput(input: BusinessInput, role: Role): Issue[] {
  const issues: Issue[] = [];
  const required: (keyof BusinessInput)[] = ["legalName", "addressLine1", "postalCode", "city"];
  for (const field of required) {
    if (!String(input[field] ?? "").trim()) issues.push(errorIssue("BUSINESS_PROFILE_INCOMPLETE", field));
  }
  if (!/^[A-Za-z]{2}$/.test(input.country)) issues.push(errorIssue("BUSINESS_PROFILE_INCOMPLETE", "country"));
  if (!isBusinessType(input.businessType)) issues.push(errorIssue("BUSINESS_TYPE_NOT_ALLOWED", "businessType"));

  const country = input.country.toUpperCase();
  const vatId = input.vatId?.trim() || null;
  if (vatId) {
    const parsed = parseVatId(vatId);
    if (!parsed.ok) {
      issues.push(errorIssue(parsed.code, "vatId"));
    } else if (country.length === 2 && parsed.vatId.prefix !== vatPrefixFor(country)) {
      issues.push(errorIssue("VAT_ID_COUNTRY_MISMATCH", "vatId", { country }));
    }
  }

  if (country === "DE") {
    // An invoice or credit note from a German business needs a tax number or VAT ID (§ 14 Abs. 4 Nr. 2 UStG).
    if (role === "CREATOR" && !input.taxNumber?.trim() && !vatId) issues.push(errorIssue("TAX_ID_REQUIRED", "taxNumber"));
  } else if (isEuCountry(country)) {
    // A business elsewhere in the EU is invoiced without VAT only against a VAT ID; a creator who is exempt as a small
    // business has none.
    const exempt = role === "CREATOR" && input.smallBusinessExempt;
    if (!vatId && !exempt) issues.push(errorIssue("VAT_ID_REQUIRED", "vatId"));
  }

  if (!input.traderSelfCertified) issues.push(errorIssue("TRADER_CERTIFICATION_REQUIRED", "traderSelfCertified"));
  if (role === "CREATOR" && !input.selfBillingAccepted) issues.push(errorIssue("SELF_BILLING_CONSENT_REQUIRED", "selfBillingAccepted"));
  return issues;
}

export type StoredBusinessProfile = {
  legalName: string;
  businessType: string;
  country: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  phone: string | null;
  registerNumber: string | null;
  taxNumber: string | null;
  vatId: string | null;
  vatIdStatus: VatIdStatus;
  smallBusinessExempt: boolean;
  traderSelfCertifiedAt: Date | null;
  selfBillingAcceptedAt: Date | null;
};

export function profileToInput(profile: StoredBusinessProfile): BusinessInput {
  return {
    legalName: profile.legalName,
    businessType: profile.businessType,
    country: profile.country,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    postalCode: profile.postalCode,
    city: profile.city,
    phone: profile.phone,
    registerNumber: profile.registerNumber,
    taxNumber: profile.taxNumber,
    vatId: profile.vatId,
    smallBusinessExempt: profile.smallBusinessExempt,
    traderSelfCertified: profile.traderSelfCertifiedAt !== null,
    selfBillingAccepted: profile.selfBillingAcceptedAt !== null,
  };
}

// What stands between a stored profile and signing a deal. A VAT ID outside Germany also has to have passed VIES.
export function businessReadiness(profile: StoredBusinessProfile | null, role: Role): Issue[] {
  if (!profile) return [errorIssue("BUSINESS_PROFILE_INCOMPLETE")];
  const issues = validateBusinessInput(profileToInput(profile), role);
  const country = profile.country.toUpperCase();
  if (profile.vatId && country !== "DE" && isEuCountry(country) && profile.vatIdStatus !== "VALID") {
    issues.push(errorIssue("VAT_ID_NOT_VERIFIED", "vatId"));
  }
  return issues;
}
