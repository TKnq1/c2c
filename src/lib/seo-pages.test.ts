import { describe, expect, it } from "vitest";
import { NICHES } from "@/lib/constants";
import sitemap from "@/app/sitemap";
import { getUgcNichePage, UGC_HUB_FAQS, UGC_NICHE_PAGES, ugcNicheHref } from "@/lib/seo-pages";

const allTexts = () =>
  [
    ...UGC_HUB_FAQS.flatMap((f) => [f.question, f.answer]),
    ...UGC_NICHE_PAGES.flatMap((p) => [
      p.title,
      p.description,
      p.heading,
      p.lead,
      ...p.formats.flatMap((f) => [f.title, f.text]),
      ...p.faqs.flatMap((f) => [f.question, f.answer]),
    ]),
  ].join("\n");

describe("German search pages", () => {
  it("has one page per slug, each for a real niche", () => {
    const slugs = UGC_NICHE_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const page of UGC_NICHE_PAGES) {
      expect(NICHES).toContain(page.niche);
      expect(getUgcNichePage(page.slug)).toBe(page);
    }
    expect(getUgcNichePage("does-not-exist")).toBeUndefined();
  });

  it("keeps titles and descriptions within what a search result shows", () => {
    for (const page of UGC_NICHE_PAGES) {
      // The site adds " · comtor" to the title.
      expect(page.title.length + 9).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("gives every page its own text rather than the same one with another word", () => {
    const leads = UGC_NICHE_PAGES.map((p) => p.lead);
    expect(new Set(leads).size).toBe(leads.length);
    for (const page of UGC_NICHE_PAGES) {
      expect(page.formats.length).toBeGreaterThanOrEqual(4);
      expect(page.faqs.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("avoids the wording the payment model has not been cleared for", () => {
    expect(allTexts()).not.toMatch(/escrow|treuhand/i);
  });

  it("states the fee and the review period from the constants", () => {
    const text = allTexts();
    expect(text).toContain("10 %");
    expect(text).toContain("3 Tage");
  });

  it("is in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((u) => u.endsWith("/ugc"))).toBe(true);
    for (const page of UGC_NICHE_PAGES) expect(urls.some((u) => u.endsWith(ugcNicheHref(page.slug)))).toBe(true);
  });
});
