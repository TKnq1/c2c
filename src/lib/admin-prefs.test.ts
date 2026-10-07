import { describe, expect, it } from "vitest";
import { orderedTiles, prefsSchema, TILE_KEYS } from "@/lib/admin-prefs";

describe("orderedTiles", () => {
  it("follows the saved order and puts blocks added later at the end", () => {
    expect(orderedTiles(["funnel", "ziele"], [])).toEqual(["funnel", "ziele", "kennzahlen", "geld", "markt", "ads", "anmeldungen"]);
  });

  it("drops hidden blocks, unknown names and repeats", () => {
    const result = orderedTiles(["funnel", "funnel", "gibt-es-nicht"], ["ziele", "markt"]);
    expect(result).toEqual(["funnel", "kennzahlen", "geld", "ads", "anmeldungen"]);
  });

  it("shows everything in the default order when nothing was saved", () => {
    expect(orderedTiles([], [])).toEqual([...TILE_KEYS]);
  });
});

describe("prefsSchema", () => {
  const valid = {
    displayName: "Anna",
    accent: "green",
    compact: false,
    hiddenTiles: [],
    tileOrder: [...TILE_KEYS],
    goalBrands: 50,
    goalCreators: 100,
    goalMonthlyFeeCents: 100000,
    morningEnabled: true,
    morningFromHour: 5,
    morningToHour: 11,
    morningEveryTime: false,
    songVolume: 55,
  };

  it("accepts a complete, sensible set", () => {
    expect(prefsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a morning window that ends before it starts", () => {
    expect(prefsSchema.safeParse({ ...valid, morningFromHour: 11, morningToHour: 5 }).success).toBe(false);
  });

  it("rejects an unknown accent, an unknown tile and a volume above 100", () => {
    expect(prefsSchema.safeParse({ ...valid, accent: "neon" }).success).toBe(false);
    expect(prefsSchema.safeParse({ ...valid, hiddenTiles: ["geheim"] }).success).toBe(false);
    expect(prefsSchema.safeParse({ ...valid, songVolume: 101 }).success).toBe(false);
  });
});
