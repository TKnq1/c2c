import type { Catalog } from "@/lib/i18n/messages/types";
import type { Locale } from "@/lib/i18n/locales";

// Client side: a language is fetched when the visitor switches to it, each as its own chunk.
// The language the page was rendered in arrives with the page (see I18nProvider).
const LOADERS: Record<Locale, () => Promise<Catalog>> = {
  en: () => import("@/lib/i18n/messages/en").then((m) => m.en),
  de: () => import("@/lib/i18n/messages/de").then((m) => m.de),
  fr: () => import("@/lib/i18n/messages/fr").then((m) => m.fr),
  es: () => import("@/lib/i18n/messages/es").then((m) => m.es),
  it: () => import("@/lib/i18n/messages/it").then((m) => m.it),
  pt: () => import("@/lib/i18n/messages/pt").then((m) => m.pt),
  nl: () => import("@/lib/i18n/messages/nl").then((m) => m.nl),
  pl: () => import("@/lib/i18n/messages/pl").then((m) => m.pl),
};

export function loadCatalog(locale: Locale): Promise<Catalog> {
  return LOADERS[locale]();
}
