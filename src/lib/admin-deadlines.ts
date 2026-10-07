import { prisma } from "@/lib/prisma";
import { RELEASE_REVIEW_MS } from "@/lib/constants";
import { median } from "@/lib/admin-market";

const DAY = 24 * 60 * 60 * 1000;
// How long a report may wait before the page calls it late. A working target of ours, not a legal deadline.
export const REPORT_TARGET_DAYS = 2;

// When a submitted post is released to the creator if the brand says nothing.
export const releaseAt = (proofSubmittedAt: Date) => new Date(proofSubmittedAt.getTime() + RELEASE_REVIEW_MS);

// Time from a report coming in to an admin closing it, for the closed ones.
export function turnaroundMs(pairs: { filed: Date; closed: Date }[]): number | null {
  return median(pairs.map((p) => Math.max(0, p.closed.getTime() - p.filed.getTime())));
}

export type Deadlines = Awaited<ReturnType<typeof loadDeadlines>>;

export async function loadDeadlines(now = new Date()) {
  const since90 = new Date(now.getTime() - 90 * DAY);
  const [reportAgg, reports, disputes, releasing, releasingTotal, closedLogs, pendingConsents, deleted30] = await Promise.all([
    prisma.report.aggregate({ where: { status: "OPEN" }, _count: true }),
    prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      take: 8,
      select: { id: true, reason: true, createdAt: true, reporterId: true, reported: { select: { email: true } } },
    }),
    prisma.interest.findMany({
      where: { paymentStatus: "HELD", disputedAt: { not: null } },
      orderBy: { disputedAt: "asc" },
      take: 8,
      select: { id: true, amountCents: true, disputedAt: true, request: { select: { title: true } } },
    }),
    prisma.interest.findMany({
      where: { paymentStatus: "HELD", disputedAt: null, proofSubmittedAt: { not: null } },
      orderBy: { proofSubmittedAt: "asc" },
      take: 8,
      select: { id: true, amountCents: true, proofSubmittedAt: true, request: { select: { title: true } } },
    }),
    prisma.interest.count({ where: { paymentStatus: "HELD", disputedAt: null, proofSubmittedAt: { not: null } } }),
    prisma.adminAuditLog.findMany({
      where: { action: { in: ["report.resolve", "report.dismiss"] }, createdAt: { gte: since90 }, targetId: { not: null } },
      select: { targetId: true, createdAt: true },
    }),
    prisma.user.count({ where: { marketingConsentAt: null, marketingSentAt: { not: null }, marketingTokenExpiresAt: { gt: now } } }),
    prisma.user.count({ where: { deletedAt: { gte: new Date(now.getTime() - 30 * DAY) } } }),
  ]);

  const filedAt = new Map(
    (await prisma.report.findMany({ where: { id: { in: closedLogs.map((l) => l.targetId as string) } }, select: { id: true, createdAt: true } })).map((r) => [r.id, r.createdAt]),
  );
  const pairs = closedLogs.flatMap((l) => {
    const filed = filedAt.get(l.targetId as string);
    return filed ? [{ filed, closed: l.createdAt }] : [];
  });

  const age = (date: Date) => Math.floor((now.getTime() - date.getTime()) / DAY);
  return {
    reportsOpen: reportAgg._count,
    reportTargetDays: REPORT_TARGET_DAYS,
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      about: r.reported.email,
      automatic: r.reporterId === null,
      ageDays: age(r.createdAt),
      late: now.getTime() - r.createdAt.getTime() > REPORT_TARGET_DAYS * DAY,
    })),
    turnaround: turnaroundMs(pairs),
    turnaroundCount: pairs.length,
    disputes: disputes.map((d) => ({ id: d.id, title: d.request.title, amountCents: d.amountCents ?? 0, ageDays: age(d.disputedAt as Date) })),
    releasing: releasing.map((r) => {
      const at = releaseAt(r.proofSubmittedAt as Date);
      return { id: r.id, title: r.request.title, amountCents: r.amountCents ?? 0, at, overdue: at <= now };
    }),
    releasingTotal,
    pendingConsents,
    deleted30,
  };
}
