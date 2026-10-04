import { en, type Messages } from "@/lib/i18n/messages/en";
import { de } from "@/lib/i18n/messages/de";
import { es } from "@/lib/i18n/messages/es";
import { fr } from "@/lib/i18n/messages/fr";
import { it } from "@/lib/i18n/messages/it";
import { nl } from "@/lib/i18n/messages/nl";
import { pl } from "@/lib/i18n/messages/pl";
import { pt } from "@/lib/i18n/messages/pt";
import type { Catalog } from "@/lib/i18n/messages/types";
import type { Locale } from "@/lib/i18n/locales";

const CATALOGS: Record<Locale, Catalog> = { en, de, fr, es, it, pt, nl, pl };

type Leaves<T, P extends string = ""> = T extends string
  ? P
  : { [K in keyof T & string]: Leaves<T[K], P extends "" ? K : `${P}.${K}`> }[keyof T & string];

export type MessageKey = Leaves<Messages>;

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

function lookup(source: object, key: string): string | undefined {
  let cur: unknown = source;
  for (const part of key.split(".")) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function createT(locale: Locale): TFunction {
  const messages = CATALOGS[locale];
  return (key, vars) => {
    const value = lookup(messages, key) ?? lookup(en, key) ?? key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name: string) => (vars[name] === undefined ? `{${name}}` : String(vars[name])));
  };
}

export function localizedList(items: string[], andWord: string): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${andWord} ${items[items.length - 1]}`;
}
