// App UI languages — the most widely used ones in Europe. Native names,
// because the picker has to be readable before a language is chosen.
// Content languages for matching live in src/lib/constants.ts and are a
// different list on purpose.
export const APP_LOCALES = [
  { id: "en", native: "English" },
  { id: "de", native: "Deutsch" },
  { id: "fr", native: "Français" },
  { id: "es", native: "Español" },
  { id: "it", native: "Italiano" },
  { id: "pt", native: "Português" },
  { id: "nl", native: "Nederlands" },
  { id: "pl", native: "Polski" },
] as const;

export type Locale = (typeof APP_LOCALES)[number]["id"];

// German first: comtor starts in the German-speaking countries. Anyone without a language choice (a first visit,
// a search engine, a link preview) gets German; the landing page offers a switch to English.
export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_COOKIE = "locale";

// A year. Not httpOnly: the onboarding step reads it to tell "already
// chosen" from "browser guess". It is not a secret.
export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

export function isLocale(value: string | undefined | null): value is Locale {
  return APP_LOCALES.some((locale) => locale.id === value);
}

export function parseLocale(value: string | undefined | null): Locale {
  const code = value?.toLowerCase().split("-")[0];
  return isLocale(code) ? code : DEFAULT_LOCALE;
}
