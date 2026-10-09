import { describe, expect, it } from "vitest";
import { APP_LOCALES, parseLocale } from "@/lib/i18n/locales";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CATALOGS, createT } from "@/lib/i18n/catalogs";
import { localizeError, TRANSLATED_ERROR_MESSAGES } from "@/lib/i18n/labels";

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

describe("landing, founding and FAQ text", () => {
  it("is written out in every language", () => {
    expect(createT("de")("landing.hero.creatorTitleA")).toBe("Wisch bezahlte");
    expect(createT("en")("landing.hero.creatorTitleA")).toBe("Swipe right on");
    for (const locale of APP_LOCALES.map((l) => l.id).filter((id) => id !== "en")) {
      expect(createT(locale)("landing.hero.creatorTitleA"), locale).not.toBe("Swipe right on");
      expect(createT(locale)("founding.title"), locale).not.toBe(createT("en")("founding.title"));
    }
  });

  it("keeps every key and placeholder of the English text in every language", () => {
    const flatten = (value: object, prefix = ""): Record<string, string> =>
      Object.entries(value).reduce<Record<string, string>>((all, [key, item]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof item === "string" ? { ...all, [path]: item } : { ...all, ...flatten(item, path) };
      }, {});
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");
    const english = flatten(CATALOGS.en);
    for (const { id } of APP_LOCALES) {
      const other = flatten(CATALOGS[id]);
      expect(Object.keys(other).sort(), id).toEqual(Object.keys(english).sort());
      for (const [key, text] of Object.entries(english)) {
        if (!/^(landing|founding|faq|extras)\./.test(key)) continue;
        expect(placeholders(other[key]), `${id} ${key}`).toBe(placeholders(text));
      }
    }
  });
});

describe("server error messages", () => {
  const sources = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return name === "i18n" ? [] : sources(path);
      return /\.tsx?$/.test(name) && !name.endsWith(".test.ts") ? [readFileSync(path, "utf8")] : [];
    });
  const code = [...sources(join(process.cwd(), "src/lib")), ...sources(join(process.cwd(), "src/app"))].join("\n");
  // Messages that live in the catalog's own landing texts, not in server code.
  const FROM_CATALOG = new Set(["Enter a valid email address.", "Too many attempts. Try again later.", "That didn't work. Try again in a moment."]);

  it("still sends every English message that has a translation", () => {
    for (const message of TRANSLATED_ERROR_MESSAGES) {
      if (FROM_CATALOG.has(message)) continue;
      const literal = message.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      expect(code.includes(message) || code.includes(literal), message).toBe(true);
    }
  });

  it("translates them in every language and leaves unknown text alone", () => {
    for (const { id } of APP_LOCALES) {
      const t = createT(id);
      for (const message of TRANSLATED_ERROR_MESSAGES) {
        expect(localizeError(message, t).length, `${id}: ${message}`).toBeGreaterThan(0);
      }
      expect(localizeError("Something nobody translated", t)).toBe("Something nobody translated");
    }
    expect(localizeError("Not authorized.", createT("de"))).not.toBe("Not authorized.");
    expect(localizeError("Anna hasn't finished setting up payouts yet, so it can't be released.", createT("de"))).toContain("Anna");
    expect(localizeError("Add at most 6 photos.", createT("fr"))).toContain("6");
  });
});
