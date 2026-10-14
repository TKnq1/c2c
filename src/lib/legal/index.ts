import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locales";
import { legalDe } from "@/lib/legal/de";
import { legalEn } from "@/lib/legal/en";
import { legalEs } from "@/lib/legal/content-es";
import { legalFr } from "@/lib/legal/content-fr";
import { legalIt } from "@/lib/legal/content-it";
import { legalNl } from "@/lib/legal/content-nl";
import { legalPl } from "@/lib/legal/content-pl";
import { legalPt } from "@/lib/legal/content-pt";
import type { LegalContent } from "@/lib/legal/types";

// The legal pages in the reader's language. German is binding: every other language carries a notice that says so.
export const LEGAL_CONTENT: Record<Locale, LegalContent> = {
  de: legalDe,
  en: legalEn,
  fr: legalFr,
  es: legalEs,
  it: legalIt,
  pt: legalPt,
  nl: legalNl,
  pl: legalPl,
};

export async function getLegal(): Promise<LegalContent> {
  return LEGAL_CONTENT[await getLocale()];
}
