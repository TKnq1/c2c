"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export type MoneyActionResult = { error?: string };

const NOT_AUTHORIZED: MoneyActionResult = { error: "Keine Berechtigung." };
const refresh = () => revalidatePath("/admin", "layout");
const euros = z.number().finite().min(0.01, "Der Betrag muss größer als 0 sein.").max(1_000_000, "Der Betrag ist zu groß.");

const costSchema = z.object({
  name: z.string().trim().min(2, "Gib dem Posten einen Namen.").max(60),
  amount: euros,
  interval: z.enum(["MONTHLY", "YEARLY"]),
  note: z.string().trim().max(120).nullable().optional(),
});

export async function addFixedCostAction(input: unknown): Promise<MoneyActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = costSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Die Eingabe passt nicht." };
  await prisma.fixedCost.create({
    data: { name: parsed.data.name, amountCents: Math.round(parsed.data.amount * 100), interval: parsed.data.interval, note: parsed.data.note || null },
  });
  refresh();
  return {};
}

export async function setFixedCostActiveAction(id: string, active: boolean): Promise<MoneyActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) return { error: "Posten nicht gefunden." };
  await prisma.fixedCost.updateMany({ where: { id }, data: { active: !!active } });
  refresh();
  return {};
}

export async function deleteFixedCostAction(id: string): Promise<MoneyActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) return { error: "Posten nicht gefunden." };
  await prisma.fixedCost.deleteMany({ where: { id } });
  refresh();
  return {};
}

const balanceSchema = z.object({ balance: z.number().finite().min(-1_000_000_000).max(1_000_000_000) });

// The bank balance as of now. Every entry also leaves a snapshot, so the balance has a history.
export async function setCashBalanceAction(input: unknown): Promise<MoneyActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = balanceSchema.safeParse(input);
  if (!parsed.success) return { error: "Gib den Kontostand als Zahl in Euro ein." };
  const cents = Math.round(parsed.data.balance * 100);
  const now = new Date();
  await prisma.$transaction([
    prisma.adminSettings.upsert({ where: { id: 1 }, create: { id: 1, cashBalanceCents: cents, cashBalanceAt: now }, update: { cashBalanceCents: cents, cashBalanceAt: now } }),
    prisma.cashSnapshot.create({ data: { balanceCents: cents, at: now } }),
  ]);
  refresh();
  return {};
}
