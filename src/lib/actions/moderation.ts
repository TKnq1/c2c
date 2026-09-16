"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ReportActionState = { error?: string; success?: boolean } | undefined;

export async function reportUserAction(
  reportedUserId: string,
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };
  if (reportedUserId === session.user.id) return { error: "You can't report yourself." };

  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "")
    .trim()
    .slice(0, 500);
  if (!reason) return { error: "Choose a reason." };

  await prisma.report.create({
    data: { reporterId: session.user.id, reportedId: reportedUserId, reason, details: details || null },
  });

  return { success: true };
}

function revalidateModerationSurfaces() {
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/startup/discover");
  revalidatePath("/dashboard/creator");
}

export async function blockUserAction(otherUserId: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");
  if (otherUserId === session.user.id) throw new Error("You can't block yourself.");

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: otherUserId } },
    create: { blockerId: session.user.id, blockedId: otherUserId },
    update: {},
  });

  revalidateModerationSurfaces();
}

export async function unblockUserAction(otherUserId: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

  await prisma.block.deleteMany({ where: { blockerId: session.user.id, blockedId: otherUserId } });

  revalidateModerationSurfaces();
}

export async function resolveReportAction(reportId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Not authorized.");

  await prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED" } });
  revalidatePath("/admin");
}

export async function dismissReportAction(reportId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Not authorized.");

  await prisma.report.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
  revalidatePath("/admin");
}
