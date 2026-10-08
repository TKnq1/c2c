import { prisma } from "@/lib/prisma";
import { AREA_LABEL, berlinDay, dayComplete, previousDay, routinesFor, streak, type RoutineArea } from "@/lib/admin-routines";
import { formatCents } from "@/lib/format";

const STREAK_DAYS = 60;

// Midnight in Berlin at the start of `day`, whichever of the two offsets it has that day.
function berlinMidnight(day: string): Date {
  for (const offset of ["+02:00", "+01:00"]) {
    const d = new Date(`${day}T00:00:00${offset}`);
    if (berlinDay(d).day === day && berlinDay(new Date(d.getTime() - 1)).day !== day) return d;
  }
  return new Date(`${day}T00:00:00Z`);
}

export type PlanItem = { key: string; label: string; detail?: string; href?: string; done: boolean };
export type PlanGroup = { area: RoutineArea; title: string; items: PlanItem[] };
export type DailyPlan = { day: string; groups: PlanGroup[]; done: number; total: number; streak: number };

// Today's routines with what is ticked off, the streak, and yesterday's figures for "Zahlen von gestern ansehen".
export async function loadDailyPlan(adminId: string, now = new Date()): Promise<DailyPlan> {
  const { day } = berlinDay(now);
  const yesterday = previousDay(day);
  const [from, to] = [berlinMidnight(yesterday), berlinMidnight(day)];
  let oldest = day;
  for (let i = 0; i < STREAK_DAYS; i++) oldest = previousDay(oldest);

  const [ticks, newUsers, paid] = await Promise.all([
    prisma.adminRoutineCheck.findMany({ where: { adminId, day: { gte: oldest } }, select: { day: true, key: true } }),
    prisma.user.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.interest.aggregate({ where: { paidAt: { gte: from, lt: to } }, _count: true, _sum: { amountCents: true } }),
  ]);

  const byDay = new Map<string, Set<string>>();
  for (const t of ticks) {
    if (!byDay.has(t.day)) byDay.set(t.day, new Set());
    byDay.get(t.day)!.add(t.key);
  }
  const complete = new Set([...byDay].filter(([d, keys]) => dayComplete(d, keys)).map(([d]) => d));
  const today = byDay.get(day) ?? new Set<string>();

  const deals = paid._count;
  const figures = `Gestern: ${newUsers} ${newUsers === 1 ? "neuer Nutzer" : "neue Nutzer"}, ${deals} ${deals === 1 ? "Deal" : "Deals"}, ${formatCents(paid._sum.amountCents ?? 0)} Volumen`;

  const due = routinesFor(now);
  const groups: PlanGroup[] = (Object.keys(AREA_LABEL) as RoutineArea[])
    .map((area) => ({
      area,
      title: AREA_LABEL[area],
      items: due
        .filter((r) => r.area === area)
        .map((r) => ({ key: r.key, label: r.label, href: r.href, detail: r.key === "numbers.yesterday" ? figures : undefined, done: today.has(r.key) })),
    }))
    .filter((g) => g.items.length > 0);

  return { day, groups, done: due.filter((r) => today.has(r.key)).length, total: due.length, streak: streak(complete, day) };
}
