// Client-safe: types, defaults and the validation of what the settings form sends. The database read is in
// admin-prefs-server.ts, so a client component importing this never pulls the database client into the browser.
import { z } from "zod";
import { ACCENT_KEYS, DEFAULT_ACCENT, type AccentKey } from "@/lib/admin-theme";

// The blocks under "Mehr Details" on the "Heute" page that an admin can hide or reorder. What needs attention and the four
// headline figures above them are always there.
export const TILE_KEYS = ["kennzahlen", "geld", "ziele", "markt", "funnel", "ads", "anmeldungen"] as const;
export type TileKey = (typeof TILE_KEYS)[number];

export const TILE_LABELS: Record<TileKey, string> = {
  kennzahlen: "Alle Kennzahlen",
  geld: "Geld",
  ziele: "Ziele",
  markt: "Marktplatz-Gesundheit",
  funnel: "Funnel",
  ads: "Ads",
  anmeldungen: "Anmeldungen pro Tag",
};

// The four figures at the top of "Heute": what each set contains is in src/lib/admin-kpis.ts.
export const KPI_SETS = ["wachstum", "geld", "marketing", "gemischt"] as const;
export type KpiSet = (typeof KPI_SETS)[number];
export const KPI_SET_LABELS: Record<KpiSet, string> = { wachstum: "Wachstum", geld: "Geld", marketing: "Marketing", gemischt: "Gemischt" };
export const KPI_SET_HINTS: Record<KpiSet, string> = {
  wachstum: "Nutzer, aktive Nutzer, Founding-Plätze, Anfragen ohne Interesse",
  geld: "Provision, Zahlungsvolumen, Pro-Abos, Reichweite des Geldes",
  marketing: "Ausgaben, Kosten je Anmeldung, Klick zur Anmeldung, Anmeldungen mit Kampagne",
  gemischt: "Nutzer, Provision, Anfragen ohne Interesse, Kosten je Anmeldung",
};
export const isKpiSet = (value: string): value is KpiSet => (KPI_SETS as readonly string[]).includes(value);

export type AdminPrefs = {
  displayName: string | null;
  accent: AccentKey;
  compact: boolean;
  hiddenTiles: TileKey[];
  tileOrder: TileKey[];
  goalBrands: number;
  goalCreators: number;
  goalMonthlyFeeCents: number;
  morningEnabled: boolean;
  morningFromHour: number;
  morningToHour: number;
  morningEveryTime: boolean;
  songVolume: number;
  panelOpen: boolean;
  kpiSet: KpiSet;
  mailDaily: boolean;
  mailUrgent: boolean;
  mailWeekly: boolean;
  setupDone: boolean;
};

export const DEFAULT_PREFS: AdminPrefs = {
  displayName: null,
  accent: DEFAULT_ACCENT,
  compact: false,
  hiddenTiles: [],
  tileOrder: [...TILE_KEYS],
  goalBrands: 50,
  goalCreators: 100,
  goalMonthlyFeeCents: 100_000,
  morningEnabled: true,
  morningFromHour: 5,
  morningToHour: 11,
  morningEveryTime: false,
  songVolume: 55,
  panelOpen: false,
  kpiSet: "wachstum",
  mailDaily: true,
  mailUrgent: true,
  mailWeekly: true,
  setupDone: false,
};

export const isTile = (value: string): value is TileKey => (TILE_KEYS as readonly string[]).includes(value);

// The blocks to show, in the saved order: unknown names are dropped, blocks added since the order was saved come last,
// hidden ones are left out.
export function orderedTiles(order: string[], hidden: string[]): TileKey[] {
  const seen = new Set<TileKey>();
  const result: TileKey[] = [];
  for (const key of [...order, ...TILE_KEYS]) {
    if (isTile(key) && !seen.has(key)) {
      seen.add(key);
      if (!hidden.includes(key)) result.push(key);
    }
  }
  return result;
}

const hour = z.number().int().min(0).max(24);

// What the settings form may send. Everything is checked here, not in the form.
export const prefsSchema = z
  .object({
    displayName: z.string().trim().max(40).nullable(),
    accent: z.enum(ACCENT_KEYS as [AccentKey, ...AccentKey[]]),
    compact: z.boolean(),
    hiddenTiles: z.array(z.enum(TILE_KEYS)).max(TILE_KEYS.length),
    tileOrder: z.array(z.enum(TILE_KEYS)).max(TILE_KEYS.length),
    goalBrands: z.number().int().min(1).max(100_000),
    goalCreators: z.number().int().min(1).max(100_000),
    goalMonthlyFeeCents: z.number().int().min(100).max(1_000_000_000),
    morningEnabled: z.boolean(),
    morningFromHour: hour,
    morningToHour: hour,
    morningEveryTime: z.boolean(),
    songVolume: z.number().int().min(0).max(100),
    kpiSet: z.enum(KPI_SETS),
    mailDaily: z.boolean(),
    mailUrgent: z.boolean(),
    mailWeekly: z.boolean(),
  })
  .refine((v) => v.morningFromHour < v.morningToHour, { message: "Das Zeitfenster muss vor dem Ende anfangen.", path: ["morningToHour"] });

export type PrefsInput = z.infer<typeof prefsSchema>;
