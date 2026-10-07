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
  } catch (error) {
    console.error("Could not write the mail log", error);
  }
}

export async function pruneMailLog(now = new Date()) {
  await prisma.mailLog.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - MAIL_LOG_DAYS * DAY) } } });
}
