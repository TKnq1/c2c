import { prisma } from "@/lib/prisma";
import { dailySeries, windowStart } from "@/lib/admin-stats";
import { pct } from "@/lib/admin-growth";
import { outreachEnabled } from "@/lib/outreach-enabled";

const DAYS = 30;

export type SubjectRow = { subject: string; count: number; failed: number };

// Groups the send log by subject, most sent first. A subject that failed at least once is flagged by the page.
export function bySubject(logs: { subject: string; ok: boolean }[]): SubjectRow[] {
  const map = new Map<string, SubjectRow>();
  for (const l of logs) {
    const row = map.get(l.subject) ?? { subject: l.subject, count: 0, failed: 0 };
    row.count++;
    if (!l.ok) row.failed++;
    map.set(l.subject, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject));
}

export type Mails = Awaited<ReturnType<typeof loadMails>>;

export async function loadMails(now = new Date()) {
  const since = windowStart(DAYS, now);
  const [logs, firstLog, recentFailures, addresses, consented, suppressions, mailings, waitlistTotal, waitlistConfirmed, waitlistPending, newsletterUsers] = await Promise.all([
    prisma.mailLog.findMany({ where: { createdAt: { gte: since } }, select: { subject: true, ok: true, createdAt: true }, take: 50_000 }),
    prisma.mailLog.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.mailLog.findMany({ where: { ok: false }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, subject: true, error: true, createdAt: true } }),
    prisma.outreachAddress.count(),
    prisma.outreachAddress.count({ where: { consentAt: { not: null } } }),
    prisma.outreachSuppression.count(),
    prisma.outreachMailing.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, side: true, subject: true, createdAt: true, _count: { select: { deliveries: true } } } }),
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { confirmedAt: { not: null } } }),
    prisma.waitlistEntry.count({ where: { confirmedAt: null, confirmSentAt: { not: null } } }),
    prisma.user.count({ where: { marketingConsentAt: { not: null }, deletedAt: null } }),
  ]);

  const failed = logs.filter((l) => !l.ok).length;
  return {
    days: DAYS,
    loggedSince: firstLog?.createdAt ?? null,
    sent: logs.length - failed,
    failed,
    failureRate: pct(failed, logs.length),
    sentByDay: dailySeries(logs.filter((l) => l.ok), DAYS, (l) => l.createdAt, () => 1, now),
    failedByDay: dailySeries(logs.filter((l) => !l.ok), DAYS, (l) => l.createdAt, () => 1, now),
    subjects: bySubject(logs).slice(0, 12),
    recentFailures,
    outreach: {
      enabled: outreachEnabled(),
      addresses,
      consented,
      withoutConsent: addresses - consented,
      suppressions,
      mailings: mailings.map((m) => ({ id: m.id, side: m.side, subject: m.subject, at: m.createdAt, sent: m._count.deliveries })),
    },
    waitlist: { total: waitlistTotal, confirmed: waitlistConfirmed, pending: waitlistPending },
    newsletterUsers,
  };
}
