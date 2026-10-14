import { describe, expect, it } from "vitest";
import { APP_LOCALES } from "@/lib/i18n/locales";
import { UGC_NICHE_PAGES } from "@/lib/seo-pages";
import { ugcContentDe } from "@/lib/ugc/content-de";
import { ugcContentEn } from "@/lib/ugc/content-en";
import { ugcContentEs } from "@/lib/ugc/content-es";
import { ugcContentFr } from "@/lib/ugc/content-fr";
import { ugcContentIt } from "@/lib/ugc/content-it";
import { ugcContentNl } from "@/lib/ugc/content-nl";
import { ugcContentPl } from "@/lib/ugc/content-pl";
import { ugcContentPt } from "@/lib/ugc/content-pt";
import type { UgcContent } from "@/lib/ugc/types";

const CONTENT: Record<(typeof APP_LOCALES)[number]["id"], UgcContent> = {
  de: ugcContentDe,
  en: ugcContentEn,
  fr: ugcContentFr,
  es: ugcContentEs,
  it: ugcContentIt,
  pt: ugcContentPt,
  nl: ugcContentNl,
  pl: ugcContentPl,
};

describe("UGC search pages in every language", () => {
  for (const [locale, content] of Object.entries(CONTENT)) {
    it(`${locale}: same niches, slugs and list sizes as German`, () => {
      expect(content.niches.map((n) => [n.slug, n.niche])).toEqual(UGC_NICHE_PAGES.map((n) => [n.slug, n.niche]));
      content.niches.forEach((page, i) => {
        const german = UGC_NICHE_PAGES[i];
        expect(page.formats.length, page.slug).toBe(german.formats.length);
        expect(page.faqs.length, page.slug).toBe(german.faqs.length);
      });
      expect(content.hubFaqs.length).toBe(ugcContentDe.hubFaqs.length);
      expect(content.creator.faqs.length).toBe(ugcContentDe.creator.faqs.length);
      expect(content.creator.steps.length).toBe(ugcContentDe.creator.steps.length);
    });

    it(`${locale}: keeps the placeholders of the page texts`, () => {
      const placeholders = (text: string) => (text.match(/\{(label|days)\}/g) ?? []).sort().join(",");
      const strings = (value: unknown): string[] => (Array.isArray(value) ? value.flatMap(strings) : typeof value === "string" ? [value] : []);
      for (const key of Object.keys(ugcContentDe.ui) as (keyof UgcContent["ui"])[]) {
        const german = strings(ugcContentDe.ui[key]);
        const other = strings(content.ui[key]);
        expect(other.map(placeholders), `${locale} ${key}`).toEqual(german.map(placeholders));
      }
    });

    it(`${locale}: never says escrow on public pages`, () => {
      expect(JSON.stringify(content)).not.toMatch(/escrow|treuhand|séquestre|depósito en garantía/i);
    });
  }
});
