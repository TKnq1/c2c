import { Prisma, type AdminNotice, type AdminNoticeKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DAY = 24 * 60 * 60 * 1000;
export const NOTICE_KEEP_DAYS = 180;

// Writes a notice once: a second call with the same dedupeKey (a retried job, two tabs) finds it there and returns null.
export async function createNotice(input: { kind: AdminNoticeKind; title: string; body: string; href?: string; dedupeKey?: string }): Promise<AdminNotice | null> {
  try {
    return await prisma.adminNotice.create({
      data: { kind: input.kind, title: input.title.slice(0, 200), body: input.body.slice(0, 8000), href: input.href ?? null, dedupeKey: input.dedupeKey ?? null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}

export const unreadNoticeCount = () => prisma.adminNotice.count({ where: { readAt: null } });

export const listNotices = (take = 60) => prisma.adminNotice.findMany({ orderBy: { createdAt: "desc" }, take });

export async function markAllNoticesRead(now = new Date()) {
  await prisma.adminNotice.updateMany({ where: { readAt: null }, data: { readAt: now } });
}

export const pruneNotices = (now = new Date()) => prisma.adminNotice.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - NOTICE_KEEP_DAYS * DAY) } } });

export type Recipient = { userId: string; email: string; mailDaily: boolean; mailUrgent: boolean; mailWeekly: boolean };

// The admins who can get a notice by mail: active accounts with admin access. Without saved preferences everything is on.
export async function adminRecipients(): Promise<Recipient[]> {
  const admins = await prisma.user.findMany({
    where: { OR: [{ role: "ADMIN" }, { isAdmin: true }], deletedAt: null, suspendedAt: null },
    select: { id: true, email: true, adminPreference: { select: { mailDaily: true, mailUrgent: true, mailWeekly: true } } },
  });
  return admins.map((a) => ({
    userId: a.id,
    email: a.email,
    mailDaily: a.adminPreference?.mailDaily ?? true,
    mailUrgent: a.adminPreference?.mailUrgent ?? true,
    mailWeekly: a.adminPreference?.mailWeekly ?? true,
  }));
}
