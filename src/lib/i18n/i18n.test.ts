import { describe, expect, it } from "vitest";
import { parseLocale } from "@/lib/i18n/locales";
import { createT } from "@/lib/i18n/translate";

describe("parseLocale", () => {
  it("keeps a supported language and falls back otherwise", () => {
    expect(parseLocale("de")).toBe("de");
    expect(parseLocale("de-AT")).toBe("de");
    expect(parseLocale("PL")).toBe("pl");
    expect(parseLocale("ja")).toBe("en");
    expect(parseLocale(undefined)).toBe("en");
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
