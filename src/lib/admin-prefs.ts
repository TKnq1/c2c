// Client-safe: types, defaults and the validation of what the settings form sends. The database read is in
// admin-prefs-server.ts, so a client component importing this never pulls the database client into the browser.
import { z } from "zod";
import { ACCENT_KEYS, DEFAULT_ACCENT, type AccentKey } from "@/lib/admin-theme";

// The blocks of the "Heute" page an admin can hide or reorder. The Claude briefing and the Offen list live in the panel.
export const TILE_KEYS = ["kennzahlen", "ziele", "markt", "funnel", "anmeldungen"] as const;
export type TileKey = (typeof TILE_KEYS)[number];

export const TILE_LABELS: Record<TileKey, string> = {
  kennzahlen: "Kennzahlen",
  ziele: "Ziele",
  markt: "Marktplatz-Gesundheit",
  funnel: "Funnel",
  anmeldungen: "Anmeldungen pro Tag",
};

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
  panelOpen: true,
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
  })
  .refine((v) => v.morningFromHour < v.morningToHour, { message: "Das Zeitfenster muss vor dem Ende anfangen.", path: ["morningToHour"] });

export type PrefsInput = z.infer<typeof prefsSchema>;
