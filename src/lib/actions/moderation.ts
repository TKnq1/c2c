"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { DAY, takeToken } from "@/lib/rate-limit";
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

  // The reason is picked from a list; the cap is for anyone posting something else.
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 100);
  const details = String(formData.get("details") ?? "")
    .trim()
    .slice(0, 500);
  if (!reason) return { error: "Choose a reason." };

  if (!(await takeToken("report", session.user.id, 10, DAY))) return { error: "You've sent a lot of reports today." };
  const reported = await prisma.user.findUnique({ where: { id: reportedUserId }, select: { id: true } });
  if (!reported) return { error: "This account no longer exists." };

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
  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!other) throw new Error("This account no longer exists.");

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
  const session = await requireAdmin();
  if (!session) throw new Error("Not authorized.");

  await prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED" } });
  await audit(session.user.id, "report.resolve", reportId);
  revalidatePath("/admin", "layout");
}

export async function dismissReportAction(reportId: string) {
  const session = await requireAdmin();
  if (!session) throw new Error("Not authorized.");

  await prisma.report.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
  await audit(session.user.id, "report.dismiss", reportId);
  revalidatePath("/admin", "layout");
}
