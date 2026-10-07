import type { Messages } from "@/lib/i18n/messages/en";

// Client-safe: nothing here pulls a catalog in. Catalogs live in catalogs.ts (server, tests)
// and load-catalog.ts (client, one locale at a time).

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

// Reads a key from `messages`, then from `fallback` (when given), then falls back to the key itself.
export function makeT(messages: object, fallback?: object): TFunction {
  return (key, vars) => {
    const value = lookup(messages, key) ?? (fallback ? lookup(fallback, key) : undefined) ?? key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name: string) => (vars[name] === undefined ? `{${name}}` : String(vars[name])));
  };
}

export function localizedList(items: string[], andWord: string): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${andWord} ${items[items.length - 1]}`;
}
