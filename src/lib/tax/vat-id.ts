import type { IssueCode } from "@/lib/deals/issues";

// EU VAT identification numbers: the formats the member states publish. A number that passes here is well-formed, not
// necessarily registered; VIES (vies.ts) answers that.

export const EU_COUNTRIES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
  "NL", "PL", "PT", "RO", "SE", "SI", "SK",
] as const;

export type EuCountry = (typeof EU_COUNTRIES)[number];

export function isEuCountry(country: string): country is EuCountry {
  return (EU_COUNTRIES as readonly string[]).includes(country.toUpperCase());
}

// Greece is "GR" as a country and "EL" in a VAT number.
export function vatPrefixFor(country: string): string {
  const upper = country.toUpperCase();
  return upper === "GR" ? "EL" : upper;
}

const NUMBER_PATTERNS: Record<string, RegExp> = {
  AT: /^U\d{8}$/,
  BE: /^[01]\d{9}$/,
  BG: /^\d{9,10}$/,
  CY: /^\d{8}[A-Z]$/,
  CZ: /^\d{8,10}$/,
  DE: /^\d{9}$/,
  DK: /^\d{8}$/,
  EE: /^\d{9}$/,
  EL: /^\d{9}$/,
  ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^\d{8}$/,
  FR: /^[A-Z0-9]{2}\d{9}$/,
  HR: /^\d{11}$/,
  HU: /^\d{8}$/,
  IE: /^(\d[A-Z0-9+*]\d{5}[A-Z]{1,2}|\d{7}[A-W][A-I]?)$/,
  IT: /^\d{11}$/,
  LT: /^(\d{9}|\d{12})$/,
  LU: /^\d{8}$/,
  LV: /^\d{11}$/,
  MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/,
  PL: /^\d{10}$/,
  PT: /^\d{9}$/,
  RO: /^\d{2,10}$/,
  SE: /^\d{12}$/,
  SI: /^\d{8}$/,
  SK: /^\d{10}$/,
};

export type ParsedVatId = {
  // ISO country ("GR"), the VIES prefix ("EL") and the number after it.
  countryCode: EuCountry;
  prefix: string;
  number: string;
  normalized: string;
};

// "de 123.456.789" -> "DE123456789"
export function normalizeVatId(raw: string): string {
  return raw.toUpperCase().replace(/[\s.\-_/]/g, "");
}

export function parseVatId(raw: string): { ok: true; vatId: ParsedVatId } | { ok: false; code: IssueCode } {
  const normalized = normalizeVatId(raw);
  const prefix = normalized.slice(0, 2);
  const number = normalized.slice(2);
  const pattern = NUMBER_PATTERNS[prefix];
  if (!pattern || !pattern.test(number)) return { ok: false, code: "VAT_ID_FORMAT_INVALID" };
  const countryCode = (prefix === "EL" ? "GR" : prefix) as EuCountry;
  return { ok: true, vatId: { countryCode, prefix, number, normalized } };
}
