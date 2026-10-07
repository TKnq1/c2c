"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { cleanUtm } from "@/lib/utm";

export type AdsActionResult = { error?: string; imported?: number; skipped?: number };

const NOT_AUTHORIZED: AdsActionResult = { error: "Keine Berechtigung." };
const MAX_ROWS = 5000;
const refresh = () => revalidatePath("/admin", "layout");

const channel = z.enum(["instagram", "tiktok", "meta", "google", "other"]);
const count = z.number().int().min(0).max(2_000_000_000);
const row = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  campaignName: z.string().trim().min(1).max(120),
  spendCents: z.number().int().min(0).max(100_000_000),
  impressions: count,
  clicks: count,
});

// Upserts by day, channel and campaign: importing the same export twice changes nothing, and a corrected export overwrites.
async function save(channelValue: z.infer<typeof channel>, rows: z.infer<typeof row>[], source: string): Promise<AdsActionResult> {
  const usable = rows.flatMap((r) => {
    const campaignKey = cleanUtm(r.campaignName);
    return campaignKey ? [{ ...r, campaignKey }] : [];
  });
  for (let i = 0; i < usable.length; i += 200) {
    await prisma.$transaction(
      usable.slice(i, i + 200).map((r) => {
        const data = { campaignName: r.campaignName, spendCents: r.spendCents, impressions: r.impressions, clicks: r.clicks, source };
        return prisma.adSpend.upsert({
          where: { day_channel_campaignKey: { day: new Date(`${r.day}T00:00:00Z`), channel: channelValue, campaignKey: r.campaignKey } },
          create: { day: new Date(`${r.day}T00:00:00Z`), channel: channelValue, campaignKey: r.campaignKey, ...data },
          update: data,
        });
      }),
    );
  }
  refresh();
  return { imported: usable.length, skipped: rows.length - usable.length };
}

export async function importAdSpendAction(input: unknown): Promise<AdsActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = z.object({ channel, rows: z.array(row).min(1, "Die Datei enthält keine Zeilen.").max(MAX_ROWS, `Höchstens ${MAX_ROWS} Zeilen auf einmal.`) }).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Die Datei passt nicht." };
  return save(parsed.data.channel, parsed.data.rows, "import");
}

export async function addAdSpendAction(input: unknown): Promise<AdsActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = z
    .object({
      channel,
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Wähle einen Tag."),
      campaignName: z.string().trim().min(1, "Gib der Kampagne einen Namen.").max(120),
      spend: z.number().finite().min(0, "Der Betrag darf nicht negativ sein.").max(1_000_000),
      impressions: count,
      clicks: count,
    })
    .safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Die Eingabe passt nicht." };
  const { channel: ch, spend, ...rest } = parsed.data;
  const result = await save(ch, [{ ...rest, spendCents: Math.round(spend * 100) }], "manual");
  return result.imported ? {} : { error: "Der Kampagnenname braucht mindestens einen Buchstaben oder eine Ziffer." };
}

export async function deleteAdSpendAction(id: string): Promise<AdsActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) return { error: "Eintrag nicht gefunden." };
  await prisma.adSpend.deleteMany({ where: { id } });
  refresh();
  return {};
}
