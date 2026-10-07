import { describe, expect, it } from "vitest";
import { parseLocale } from "@/lib/i18n/locales";
import { landing } from "@/lib/i18n/messages/landing-en";
import { landingDe } from "@/lib/i18n/messages/landing-de";
import { createT } from "@/lib/i18n/catalogs";

describe("parseLocale", () => {
  it("keeps a supported language and falls back otherwise", () => {
    expect(parseLocale("de")).toBe("de");
    expect(parseLocale("de-AT")).toBe("de");
    expect(parseLocale("PL")).toBe("pl");
    expect(parseLocale("ja")).toBe("de");
    expect(parseLocale(undefined)).toBe("de");
  });
});

describe("createT", () => {
  it("translates and fills placeholders", () => {
    const t = createT("de");
    expect(t("common.continue")).toBe("Weiter");
    expect(t("feed.forYou")).toBe("Für dich");
    expect(t("onboarding.progress", { current: 1, total: 5 })).toBe("Schritt 1 von 5");
    expect(createT("pl")("settings.language")).toBe("Język");
    expect(createT("nl")("nav.settings")).toBe("Instellingen");
  });
});

describe("landing page text", () => {
  it("is German by default and English for the languages that are not translated yet", () => {
    expect(createT("de")("landing.hero.creatorTitleA")).toBe("Wisch bezahlte");
    expect(createT("en")("landing.hero.creatorTitleA")).toBe("Swipe right on");
    expect(createT("fr")("landing.hero.creatorTitleA")).toBe("Swipe right on");
  });

  it("keeps every placeholder of the English text in the German one", () => {
    const flatten = (value: object, prefix = ""): Record<string, string> =>
      Object.entries(value).reduce<Record<string, string>>((all, [key, item]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof item === "string" ? { ...all, [path]: item } : { ...all, ...flatten(item, path) };
      }, {});
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");
    const english = flatten(landing);
    const german = flatten(landingDe);
    expect(Object.keys(german).sort()).toEqual(Object.keys(english).sort());
    for (const [key, text] of Object.entries(english)) expect(placeholders(german[key])).toBe(placeholders(text));
  });
});
