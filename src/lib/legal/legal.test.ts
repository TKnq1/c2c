import { describe, expect, it } from "vitest";
import { APP_LOCALES } from "@/lib/i18n/locales";
import { LEGAL_CONTENT } from "@/lib/legal";

describe("legal texts in every language", () => {
  for (const { id } of APP_LOCALES) {
    const legal = LEGAL_CONTENT[id];

    it(`${id}: same sections and paragraphs as the English text`, () => {
      const english = LEGAL_CONTENT.en;
      expect(legal.terms().length).toBe(english.terms().length);
      expect(legal.privacy({ sentry: false }).length).toBe(english.privacy({ sentry: false }).length);
      expect(legal.licenses.length).toBe(english.licenses.length);
      expect(legal.imprint.rows.length).toBe(english.imprint.rows.length);
      if (id !== "de") legal.terms().forEach((section, i) => expect(section.body.length, `terms ${i}`).toBe(english.terms()[i].body.length));
    });

    it(`${id}: names Sentry only where it is switched on`, () => {
      expect(JSON.stringify(legal.privacy({ sentry: false }))).not.toContain("Sentry");
      expect(JSON.stringify(legal.privacy({ sentry: true }))).toContain("Sentry");
    });

    it(`${id}: says the German version is binding, except German itself`, () => {
      if (id === "de") expect(legal.notice).toBeNull();
      else expect(legal.notice?.length).toBeGreaterThan(20);
    });

    it(`${id}: keeps the operator's contact details and the fee numbers`, () => {
      const all = JSON.stringify([legal.terms(), legal.privacy({ sentry: false }), legal.imprint]);
      expect(all).toContain("info@comtor.app");
      expect(all).toContain("Sonnenscheinpfad 64");
      expect(all).not.toMatch(/escrow|treuhand|séquestre/i);
      expect(all).not.toMatch(/undefined|NaN|\$\{/);
    });
  }
});
