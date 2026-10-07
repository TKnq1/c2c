import { prisma } from "@/lib/prisma";
import { activityEvents } from "@/lib/admin-growth";
import { daysBefore, type ActivityEvent } from "@/lib/admin-trends";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

export type CohortCell = { eligible: number; active: number; rate: number } | null;
export type CohortRow = { label: string; size: number; cells: CohortCell[] };

// Who comes back. A row is the people who signed up in one week; column k is the share of them who did something in the
// k-th week after their own sign-up. A cell only counts people whose k-th week is over, and stays empty while nobody's is.
export function cohortRetention(users: { id: string; createdAt: Date }[], events: ActivityEvent[], now: Date, weeks = 8, columns = 6): CohortRow[] {
  const times = new Map<string, number[]>();
  for (const e of events) {
    const list = times.get(e.userId);
    if (list) list.push(e.at.getTime());
    else times.set(e.userId, [e.at.getTime()]);
  }
  const rows: CohortRow[] = [];
  for (let k = weeks - 1; k >= 0; k--) {
    const from = now.getTime() - (k + 1) * WEEK;
    const members = users.filter((u) => u.createdAt.getTime() > from && u.createdAt.getTime() <= from + WEEK);
    const cells: CohortCell[] = [];
    for (let w = 1; w <= columns; w++) {
      const eligible = members.filter((u) => u.createdAt.getTime() + (w + 1) * WEEK <= now.getTime());
      if (eligible.length === 0) {
        cells.push(null);
        continue;
      }
      const active = eligible.filter((u) => {
        const start = u.createdAt.getTime() + w * WEEK;
        return (times.get(u.id) ?? []).some((t) => t >= start && t < start + WEEK);
      }).length;
      cells.push({ eligible: eligible.length, active, rate: Math.round((active / eligible.length) * 100) });
    }
    rows.push({ label: new Date(from + 1).toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" }), size: members.length, cells });
  }
  return rows;
}

export async function loadCohorts(now = new Date(), weeks = 8, columns = 6) {
  const people = { role: { in: ["STARTUP", "CREATOR"] as ("STARTUP" | "CREATOR")[] }, deletedAt: null };
  const [users, events] = await Promise.all([
    prisma.user.findMany({ where: { ...people, createdAt: { gte: daysBefore(now, weeks * 7) } }, select: { id: true, createdAt: true } }),
    activityEvents(daysBefore(now, weeks * 7)),
  ]);
  return { rows: cohortRetention(users, events, now, weeks, columns), columns };
}
