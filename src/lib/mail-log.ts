import type { SendEmailResult } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const DAY = 24 * 60 * 60 * 1000;
export const MAIL_LOG_DAYS = 120;

// One row per send attempt: the subject, whether the mail service took it and, if not, why. No address is kept. Best
// effort: a failing log must never break the send itself.
export async function logMail(subject: string, result: SendEmailResult) {
  try {
    await prisma.mailLog.create({
      data: { subject: subject.slice(0, 160), ok: result.ok, error: result.ok ? null : result.error.slice(0, 300) },
    });
    if (!result.ok) await alertOnFailures(new Date());
  } catch (error) {
    console.error("Could not write the mail log", error);
  }
}

// The third failed mail in 24 hours is the moment the admin is told, once per day. Written in the dashboard first: when mail
// itself is what is broken, that is the one channel that still works.
export const MAIL_FAILURES_BEFORE_ALERT = 3;

async function alertOnFailures(now: Date) {
  const failed = await prisma.mailLog.count({ where: { ok: false, createdAt: { gte: new Date(now.getTime() - DAY) } } });
  if (failed !== MAIL_FAILURES_BEFORE_ALERT) return;
  // Loaded here, not at the top: sending a mail and alerting about mail need each other.
  const { notifyUrgent } = await import("@/lib/admin-digest");
  const { formatNoticeBody } = await import("@/lib/admin-notice-format");
  notifyUrgent({
    key: `mailfail-${now.toISOString().slice(0, 10)}`,
    title: "Mails gehen nicht raus",
    body: formatNoticeBody([{ lines: [`${failed} Mails sind in den letzten 24 Stunden fehlgeschlagen.`, "Auch Bestätigungs- und Passwort-Mails können betroffen sein.", "Ursachen und Fehlertexte stehen auf der Seite Mails."] }]),
    href: "/admin/mails",
  });
}

export async function pruneMailLog(now = new Date()) {
  await prisma.mailLog.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - MAIL_LOG_DAYS * DAY) } } });
}
