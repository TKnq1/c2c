"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prefsSchema } from "@/lib/admin-prefs";
import { prisma } from "@/lib/prisma";

export type DashboardActionResult = { error?: string };

const NOT_AUTHORIZED: DashboardActionResult = { error: "Keine Berechtigung." };

function refresh() {
  revalidatePath("/admin", "layout");
}

export async function savePrefsAction(input: unknown): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Die Eingabe passt nicht." };

  const data = { ...parsed.data, displayName: parsed.data.displayName || null };
  await prisma.adminPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });
  refresh();
  return {};
}

// The Claude panel opens and closes at once on screen; this only remembers it.
export async function setPanelOpenAction(open: boolean): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  await prisma.adminPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, panelOpen: !!open },
    update: { panelOpen: !!open },
  });
  return {};
}

export async function completeSetupAction(): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  await prisma.adminPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, setupDoneAt: new Date() },
    update: { setupDoneAt: new Date() },
  });
  refresh();
  return {};
}

const taskIdSchema = z.string().min(1).max(64);
const SNOOZE_DAYS = [1, 3, 7] as const;

export async function markTaskDoneAction(id: string): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = taskIdSchema.safeParse(id);
  if (!parsed.success) return { error: "Aufgabe nicht gefunden." };
  await prisma.adminTask.updateMany({ where: { id: parsed.data }, data: { status: "DONE", doneAt: new Date(), snoozedUntil: null } });
  refresh();
  return {};
}

export async function reopenTaskAction(id: string): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = taskIdSchema.safeParse(id);
  if (!parsed.success) return { error: "Aufgabe nicht gefunden." };
  await prisma.adminTask.updateMany({ where: { id: parsed.data }, data: { status: "OPEN", doneAt: null, snoozedUntil: null } });
  refresh();
  return {};
}

export async function snoozeTaskAction(id: string, days: number): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = taskIdSchema.safeParse(id);
  if (!parsed.success || !(SNOOZE_DAYS as readonly number[]).includes(days)) return { error: "Aufgabe nicht gefunden." };
  await prisma.adminTask.updateMany({
    where: { id: parsed.data },
    data: { status: "SNOOZED", snoozedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000) },
  });
  refresh();
  return {};
}

const newTaskSchema = z.object({
  title: z.string().trim().min(3, "Gib der Aufgabe einen kurzen Titel.").max(140),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export async function addTaskAction(input: unknown): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = newTaskSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Die Eingabe passt nicht." };
  await prisma.adminTask.create({ data: { title: parsed.data.title, priority: parsed.data.priority, source: "MANUAL" } });
  refresh();
  return {};
}

// Only the admin's own tasks can be deleted: the others are written by the checks and close themselves.
export async function deleteTaskAction(id: string): Promise<DashboardActionResult> {
  const session = await requireAdmin();
  if (!session) return NOT_AUTHORIZED;
  const parsed = taskIdSchema.safeParse(id);
  if (!parsed.success) return { error: "Aufgabe nicht gefunden." };
  await prisma.adminTask.deleteMany({ where: { id: parsed.data, source: "MANUAL" } });
  refresh();
  return {};
}
