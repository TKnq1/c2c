"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export type LogActionResult = { error?: string };

const schema = z.object({
  decidedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Wähle ein Datum."),
  title: z.string().trim().min(3, "Gib der Entscheidung einen Titel.").max(120),
  decision: z.string().trim().min(3, "Schreib auf, was entschieden wurde.").max(1000),
  reason: z.string().trim().max(1000).nullable().optional(),
});

export async function addDecisionAction(input: unknown): Promise<LogActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Keine Berechtigung." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Die Eingabe passt nicht." };
  const { decidedOn, reason, ...rest } = parsed.data;
  await prisma.decisionLog.create({ data: { ...rest, reason: reason || null, decidedOn: new Date(`${decidedOn}T00:00:00Z`) } });
  revalidatePath("/admin/log");
  return {};
}

export async function deleteDecisionAction(id: string): Promise<LogActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Keine Berechtigung." };
  if (typeof id !== "string" || id.length === 0 || id.length > 64) return { error: "Eintrag nicht gefunden." };
  await prisma.decisionLog.deleteMany({ where: { id } });
  revalidatePath("/admin/log");
  return {};
}
