import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locales";
import { RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { ugcContentDe } from "@/lib/ugc/content-de";
import { ugcContentEn } from "@/lib/ugc/content-en";
import { ugcContentEs } from "@/lib/ugc/content-es";
import { ugcContentFr } from "@/lib/ugc/content-fr";
import { ugcContentIt } from "@/lib/ugc/content-it";
import { ugcContentNl } from "@/lib/ugc/content-nl";
import { ugcContentPl } from "@/lib/ugc/content-pl";
import { ugcContentPt } from "@/lib/ugc/content-pt";
import type { UgcContent, UgcNichePage } from "@/lib/ugc/types";

// The search pages (/ugc, /ugc/<niche>, /ugc/creator-werden) in the reader's language. The URLs stay German
// (slugs are in seo-pages.ts); a visitor without a language cookie, such as a search engine, gets German.
const CONTENT: Record<Locale, UgcContent> = {
  de: ugcContentDe,
  en: ugcContentEn,
  fr: ugcContentFr,
  es: ugcContentEs,
  it: ugcContentIt,
  pt: ugcContentPt,
  nl: ugcContentNl,
  pl: ugcContentPl,
};

export async function getUgcContent(): Promise<UgcContent> {
  return CONTENT[await getLocale()];
}

export function ugcNiche(content: UgcContent, slug: string): UgcNichePage | undefined {
  return content.niches.find((page) => page.slug === slug);
}

// Fills {label} (the niche name) and {days} (the review period) in a page text.
export function ugcFill(text: string, vars: { label?: string } = {}): string {
  return text.replace(/\{(label|days)\}/g, (_, key: string) =>
    key === "days" ? String(RELEASE_REVIEW_DAYS) : (vars.label ?? ""),
  );
}
