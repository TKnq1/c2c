import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";
import { parseLocale } from "@/lib/i18n/locales";

// Accounts that signed up while mail was failing (see the mail log) never got their confirmation link. An admin can send
// it again, to one account or to all of them. "All" means: unverified accounts created since the first failed mail, that
// nobody has re-sent a link to yet. Sent in batches, because a server action has a time limit on the hosting plan.

export const RESEND_ACTION = "user.verification.resend";
export const RESEND_BATCH_SIZE = 25;
// A link someone asked for a moment ago is still in their inbox.
const FRESH_TOKEN_MS = 10 * 60 * 1000;

export async function firstMailFailureAt(): Promise<Date | null> {
  const first = await prisma.mailLog.findFirst({ where: { ok: false }, orderBy: { createdAt: "asc" }, select: { createdAt: true } });
  return first?.createdAt ?? null;
}

async function alreadyResentIds(): Promise<string[]> {
  const rows = await prisma.adminAuditLog.findMany({ where: { action: RESEND_ACTION, targetId: { not: null } }, select: { targetId: true } });
  return rows.map((row) => row.targetId).filter((id): id is string => id !== null);
}

export function audienceWhere(since: Date, resent: string[], now = new Date()): Prisma.UserWhereInput {
  return {
    emailVerified: false,
    deletedAt: null,
    suspendedAt: null,
    isAdmin: false,
    role: { not: "ADMIN" },
    createdAt: { gte: since },
    ...(resent.length > 0 && { id: { notIn: resent } }),
    emailVerificationTokens: { none: { createdAt: { gt: new Date(now.getTime() - FRESH_TOKEN_MS) } } },
  };
}

export async function verificationResendAudience(): Promise<{ count: number; since: Date | null }> {
  const since = await firstMailFailureAt();
  if (!since) return { count: 0, since: null };
  const count = await prisma.user.count({ where: audienceWhere(since, await alreadyResentIds()) });
  return { count, since };
}

// One account: used by the button on the user's page and by the batch below. A link that couldn't be mailed is deleted again,
// so the account stays in the audience for the next try.
export async function resendVerificationTo(
  adminId: string,
  user: { id: string; email: string; locale: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const startedAt = new Date();
  const result = await sendVerificationEmail(user.id, user.email, parseLocale(user.locale));
  if (!result.ok) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, createdAt: { gte: startedAt } } });
    return result;
  }
  await prisma.adminAuditLog.create({ data: { adminId, action: RESEND_ACTION, targetId: user.id } });
  return { ok: true };
}

export async function resendVerificationMails(adminId: string): Promise<{ sent: number; failed: number; remaining: number }> {
  const since = await firstMailFailureAt();
  if (!since) return { sent: 0, failed: 0, remaining: 0 };
  const where = audienceWhere(since, await alreadyResentIds());
  const batch = await prisma.user.findMany({ where, orderBy: { createdAt: "asc" }, take: RESEND_BATCH_SIZE, select: { id: true, email: true, locale: true } });
  let sent = 0;
  let failed = 0;
  for (const user of batch) {
    const result = await resendVerificationTo(adminId, user);
    if (result.ok) sent++;
    else failed++;
  }
  const total = await prisma.user.count({ where });
  return { sent, failed, remaining: Math.max(0, total - sent) };
}
