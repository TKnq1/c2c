import type { AdminTask, AdminTaskPriority, AdminTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RELEASE_REVIEW_MS } from "@/lib/constants";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// A task the admin ticked off comes back after this long if what it points at is still true.
export const REOPEN_AFTER_MS = DAY;

export type CheckResult = {
  key: string;
  title: string;
  reason?: string;
  priority: AdminTaskPriority;
  href?: string;
};

type Row = Pick<AdminTask, "id" | "dedupeKey" | "status" | "doneAt" | "snoozedUntil" | "title" | "reason" | "priority" | "href">;

export type CheckPlan = {
  create: CheckResult[];
  // Fields to refresh on a task that stays (the count in its title changed), with whether it is reopened.
  update: { id: string; check: CheckResult; reopen: boolean }[];
  // Tasks whose cause is gone: they close themselves.
  close: string[];
};

const sameFields = (row: Row, check: CheckResult) =>
  row.title === check.title && row.reason === (check.reason ?? null) && row.priority === check.priority && row.href === (check.href ?? null);

// Decides what the fixed checks do to the stored tasks. Pure, so it can be tested without a database.
export function planCheckSync(existing: Row[], active: CheckResult[], now: Date): CheckPlan {
  const byKey = new Map(existing.filter((r) => r.dedupeKey).map((r) => [r.dedupeKey as string, r]));
  const activeKeys = new Set(active.map((c) => c.key));
  const plan: CheckPlan = { create: [], update: [], close: [] };

  for (const check of active) {
    const row = byKey.get(check.key);
    if (!row) {
      plan.create.push(check);
      continue;
    }
    const snoozeOver = row.status === "SNOOZED" && (!row.snoozedUntil || row.snoozedUntil <= now);
    const doneLongAgo = row.status === "DONE" && !!row.doneAt && now.getTime() - row.doneAt.getTime() >= REOPEN_AFTER_MS;
    const reopen = snoozeOver || doneLongAgo;
    // A task that is snoozed or done and not due again is left alone, even if its numbers moved.
    if (row.status === "OPEN" ? !sameFields(row, check) : reopen) plan.update.push({ id: row.id, check, reopen });
  }

  for (const row of existing) {
    if (row.dedupeKey && !activeKeys.has(row.dedupeKey) && (row.status === "OPEN" || row.status === "SNOOZED")) plan.close.push(row.id);
  }
  return plan;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function daysSince(date: Date, now: Date) {
  const days = Math.floor((now.getTime() - date.getTime()) / DAY);
  return days <= 0 ? "heute" : days === 1 ? "gestern" : `${days} Tagen`;
}

// The fixed checks: things in the data that wait on the admin. Each returns nothing when there is nothing to do.
export async function computeChecks(now = new Date()): Promise<CheckResult[]> {
  const releaseSoonBefore = new Date(now.getTime() - (RELEASE_REVIEW_MS - DAY));
  const [reports, disputes, releaseSoon, foundingUnnotified] = await Promise.all([
    prisma.report.aggregate({ where: { status: "OPEN" }, _count: true, _min: { createdAt: true } }),
    prisma.interest.count({ where: { paymentStatus: "HELD", disputedAt: { not: null } } }),
    prisma.interest.count({ where: { paymentStatus: "HELD", disputedAt: null, proofSubmittedAt: { lte: releaseSoonBefore } } }),
    prisma.startupProfile.count({
      where: { foundingNumber: { not: null }, foundingNoticeSentAt: null, user: { suspendedAt: null, deletedAt: null } },
    }),
  ]);

  const checks: CheckResult[] = [];

  if (reports._count > 0) {
    const oldest = reports._min.createdAt;
    const old = !!oldest && now.getTime() - oldest.getTime() > 2 * DAY;
    checks.push({
      key: "reports-open",
      title: `${plural(reports._count, "offene Meldung", "offene Meldungen")}`,
      reason: oldest ? `Die älteste wartet seit ${daysSince(oldest, now)}` : undefined,
      priority: old ? "HIGH" : "MEDIUM",
      href: "/admin/moderation",
    });
  }
  if (disputes > 0) {
    checks.push({
      key: "disputes-open",
      title: `${plural(disputes, "Zahlung im Streit", "Zahlungen im Streit")}`,
      reason: "Das Geld ist eingefroren, bis du entscheidest",
      priority: "HIGH",
      href: "/admin/moderation",
    });
  }
  if (releaseSoon > 0) {
    checks.push({
      key: "release-soon",
      title: `${plural(releaseSoon, "Zahlung wird", "Zahlungen werden")} bald automatisch freigegeben`,
      reason: "Die Frist der Marke läuft in unter 24 Stunden ab",
      priority: "MEDIUM",
      href: "/admin/payments?status=SUBMITTED",
    });
  }
  if (foundingUnnotified > 0) {
    checks.push({
      key: "founding-notice-brands",
      title: `Founding-Mail an ${plural(foundingUnnotified, "Marke", "Marken")} noch nicht verschickt`,
      reason: "Sie haben Pro auf Lebenszeit, wissen es aber noch nicht",
      priority: "MEDIUM",
      href: "/admin/users?role=STARTUP&pro=1",
    });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    checks.push({
      key: "setup-anthropic-key",
      title: "Claude-API-Key in Vercel eintragen",
      reason: "Für Briefing, Chat und Content-Studio. Ohne Key bleiben sie aus.",
      priority: "LOW",
      href: "/admin/anpassen#verbindungen",
    });
  }
  return checks;
}

// Brings the stored CHECK tasks in line with what the checks find now.
export async function syncChecks(now = new Date()): Promise<void> {
  const [active, existing] = await Promise.all([
    computeChecks(now),
    prisma.adminTask.findMany({ where: { source: "CHECK" } }),
  ]);
  const plan = planCheckSync(existing, active, now);
  if (plan.create.length === 0 && plan.update.length === 0 && plan.close.length === 0) return;

  await prisma.$transaction([
    // Two admin pages loading at once can both try to create the same task: the unique key makes the second a no-op.
    prisma.adminTask.createMany({
      data: plan.create.map((c) => ({
        title: c.title,
        reason: c.reason ?? null,
        priority: c.priority,
        source: "CHECK" as const,
        href: c.href ?? null,
        dedupeKey: c.key,
      })),
      skipDuplicates: true,
    }),
    ...plan.update.map((u) =>
      prisma.adminTask.update({
        where: { id: u.id },
        data: {
          title: u.check.title,
          reason: u.check.reason ?? null,
          priority: u.check.priority,
          href: u.check.href ?? null,
          ...(u.reopen ? { status: "OPEN" as AdminTaskStatus, doneAt: null, snoozedUntil: null } : {}),
        },
      }),
    ),
    ...(plan.close.length > 0
      ? [prisma.adminTask.updateMany({ where: { id: { in: plan.close } }, data: { status: "DONE", doneAt: now, snoozedUntil: null } })]
      : []),
  ]);
}

// What the list shows: open tasks, plus snoozed ones whose time is up, most urgent first.
export function listOpenTasks(now = new Date()) {
  return prisma.adminTask.findMany({
    where: { OR: [{ status: "OPEN" }, { status: "SNOOZED", snoozedUntil: { lte: now } }] },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
}

export const PRIORITY_LABEL: Record<AdminTaskPriority, string> = { HIGH: "Hoch", MEDIUM: "Mittel", LOW: "Niedrig" };
export const SOURCE_LABEL = { CHECK: "Prüfung", CLAUDE: "Claude", MANUAL: "Von dir" } as const;
