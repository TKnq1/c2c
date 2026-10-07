import { parseDay, parseNumber } from "@/lib/csv-parse";

// Reading an advertising export (Meta Ads Manager, TikTok Ads Manager and the like): which column is which, and one clean
// row per day and campaign. The money is taken to be euros.
export type ColumnMap = { day: number | null; campaign: number | null; spend: number | null; impressions: number | null; clicks: number | null };
export type AdRow = { day: string; campaignName: string; spendCents: number; impressions: number; clicks: number };

const ALIASES: Record<keyof ColumnMap, string[]> = {
  day: ["day", "date", "tag", "datum", "reporting starts", "beginn der berichterstattung", "stat_time_day", "by day"],
  campaign: ["campaign name", "kampagnenname", "campaign", "kampagne", "campaign_name"],
  spend: ["amount spent", "ausgegebener betrag", "spend", "cost", "kosten", "total cost", "ausgaben"],
  impressions: ["impressions", "impressionen", "reichweite impressionen"],
  clicks: ["link clicks", "klicks auf link", "clicks", "klicks", "clicks (all)", "klicks (alle)", "click"],
};

const norm = (header: string) => header.trim().toLowerCase().replace(/\s+/g, " ");

// A header matches an alias when it is the alias or starts with it ("Amount spent (EUR)").
export function detectColumns(header: string[]): ColumnMap {
  const map: ColumnMap = { day: null, campaign: null, spend: null, impressions: null, clicks: null };
  const cells = header.map(norm);
  for (const key of Object.keys(ALIASES) as (keyof ColumnMap)[]) {
    // Exact matches first, so "Clicks" is not taken for "Clicks (all)" before the better candidate is seen.
    const exact = cells.findIndex((c) => ALIASES[key].includes(c));
    const loose = exact >= 0 ? exact : cells.findIndex((c) => ALIASES[key].some((a) => c.startsWith(a)));
    if (loose >= 0) map[key] = loose;
  }
  return map;
}

export function readAdRows(rows: string[][], map: ColumnMap): { rows: AdRow[]; skipped: number } {
  const out: AdRow[] = [];
  let skipped = 0;
  if (map.day === null || map.campaign === null || map.spend === null) return { rows: out, skipped: Math.max(0, rows.length - 1) };
  for (const cells of rows.slice(1)) {
    const day = parseDay(cells[map.day] ?? "");
    const campaignName = (cells[map.campaign] ?? "").trim();
    const spend = parseNumber(cells[map.spend] ?? "");
    if (!day || !campaignName || spend === null || spend < 0) {
      skipped++;
      continue;
    }
    const impressions = map.impressions === null ? 0 : Math.max(0, Math.round(parseNumber(cells[map.impressions] ?? "") ?? 0));
    const clicks = map.clicks === null ? 0 : Math.max(0, Math.round(parseNumber(cells[map.clicks] ?? "") ?? 0));
    out.push({ day, campaignName, spendCents: Math.round(spend * 100), impressions, clicks });
  }
  return { rows: out, skipped };
}

export const CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "meta", label: "Meta (Facebook und Instagram)" },
  { value: "google", label: "Google" },
  { value: "other", label: "Andere" },
] as const;

export const channelLabel = (value: string) => CHANNELS.find((c) => c.value === value)?.label ?? value;
