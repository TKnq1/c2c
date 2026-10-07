import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PREFS, isTile, type AdminPrefs } from "@/lib/admin-prefs";
import { parseAccent } from "@/lib/admin-theme";

export const getAdminPrefs = cache(async (userId: string): Promise<AdminPrefs> => {
  const row = await prisma.adminPreference.findUnique({ where: { userId } });
  if (!row) return DEFAULT_PREFS;
  return {
    displayName: row.displayName,
    accent: parseAccent(row.accent),
    compact: row.compact,
    hiddenTiles: row.hiddenTiles.filter(isTile),
    tileOrder: row.tileOrder.filter(isTile),
    goalBrands: row.goalBrands,
    goalCreators: row.goalCreators,
    goalMonthlyFeeCents: row.goalMonthlyFeeCents,
    morningEnabled: row.morningEnabled,
    morningFromHour: row.morningFromHour,
    morningToHour: row.morningToHour,
    morningEveryTime: row.morningEveryTime,
    songVolume: row.songVolume,
    panelOpen: row.panelOpen,
    setupDone: row.setupDoneAt !== null,
  };
});
