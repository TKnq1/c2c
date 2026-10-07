import { en } from "@/lib/i18n/messages/en";
import { de } from "@/lib/i18n/messages/de";
import { es } from "@/lib/i18n/messages/es";
import { fr } from "@/lib/i18n/messages/fr";
import { it } from "@/lib/i18n/messages/it";
import { nl } from "@/lib/i18n/messages/nl";
import { pl } from "@/lib/i18n/messages/pl";
import { pt } from "@/lib/i18n/messages/pt";
import type { Catalog } from "@/lib/i18n/messages/types";
import type { Locale } from "@/lib/i18n/locales";
import { makeT, type TFunction } from "@/lib/i18n/translate";

// Every catalog at once. Server code and tests only: a client component importing this ships all
// eight languages to every visitor (see load-catalog.ts for the client side).
export const CATALOGS: Record<Locale, Catalog> = { en, de, fr, es, it, pt, nl, pl };

export function createT(locale: Locale): TFunction {
  return makeT(CATALOGS[locale], en);
}
