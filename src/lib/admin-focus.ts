import type { AdminTaskPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activityEvents } from "@/lib/admin-growth";
import { dailySeries, windowStart } from "@/lib/admin-stats";
import { distinctBetween, movedOver, rollingDistinct, runningTotal, waitingSeries } from "@/lib/admin-trends";

const DAY = 24 * 60 * 60 * 1000;
// How many open tasks the top of "Heute" shows; the rest sits behind a link.
export const FOCUS_SHOWN = 3;
export const UNANSWERED_AFTER_DAYS = 3;

export type FocusTone = "calm" | "medium" | "high";

// The sentence at the top of "Heute". Only medium and high tasks count as "needs you": a low one (fill in the fixed costs)
// must not turn a quiet day into a busy one. Tasks come most urgent first.
export function focusSummary(tasks: { priority: AdminTaskPriority }[]) {
  const urgent = tasks.filter((t) => t.priority !== "LOW");
  const soft = tasks.length - urgent.length;
  const tone: FocusTone = urgent.length === 0 ? "calm" : urgent.some((t) => t.priority === "HIGH") ? "high" : "medium";
  const headline = urgent.length === 0 ? "Alles ruhig" : urgent.length === 1 ? "1 Ding braucht dich" : `${urgent.length} Dinge brauchen dich`;
  const sub =
    tone === "calm"
      ? soft > 0
        ? `Nichts Eiliges, nur ${soft} ${soft === 1 ? "Kleinigkeit" : "Kleinigkeiten"} offen.`
        : "Nichts wartet auf dich."
      : tone === "high"
        ? "Das Dringendste steht oben."
        : "Nichts brennt, aber es wartet.";
  return { tone, headline, sub, urgentTotal: urgent.length, softTotal: soft, shown: Math.min(urgent.length, FOCUS_SHOWN) };
}

// The four headline figures on growth, each with how far it moved this week and a 30-day line. Cheap queries only, so the
// top of the page never waits for the heavy blocks below it.
const TREND_DAYS = 30;

export async function loadFocus(now = new Date()) {
  const since7 = new Date(now.getTime() - 7 * DAY);
  const since14 = new Date(now.getTime() - 14 * DAY);
  const sinceWindow = windowStart(TREND_DAYS, now);
  const people = { role: { in: ["STARTUP", "CREATOR"] as ("STARTUP" | "CREATOR")[] }, deletedAt: null };
  // Active people need the days before the window too, since each day looks back a week.
  const eventsSince = new Date(sinceWindow.getTime() - 7 * DAY);

  const [signups, totalUsers, events, foundingBrands, foundingCreators, foundingBrandRows, foundingCreatorRows, openRequests] = await Promise.all([
    prisma.user.findMany({ where: { ...people, createdAt: { gte: sinceWindow } }, select: { createdAt: true } }),
    prisma.user.count({ where: people }),
    activityEvents(eventsSince),
    prisma.startupProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.creatorProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.startupProfile.findMany({ where: { foundingNumber: { not: null }, user: { createdAt: { gte: sinceWindow } } }, select: { user: { select: { createdAt: true } } } }),
    prisma.creatorProfile.findMany({ where: { foundingNumber: { not: null }, user: { createdAt: { gte: sinceWindow } } }, select: { user: { select: { createdAt: true } } } }),
    prisma.request.findMany({
      where: { status: "OPEN", closedByAdmin: false },
      select: { createdAt: true, interests: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 } },
    }),
  ]);

  const dailyUsers = dailySeries(signups, TREND_DAYS, (u) => u.createdAt, () => 1, now);
  const usersSeries = runningTotal(dailyUsers, totalUsers);
  const foundingTotal = foundingBrands + foundingCreators;
  const foundingDaily = dailySeries([...foundingBrandRows, ...foundingCreatorRows], TREND_DAYS, (p) => p.user.createdAt, () => 1, now);
  const foundingSeries = runningTotal(foundingDaily, foundingTotal);
  const activeSeries = rollingDistinct(events, TREND_DAYS, 7, now);
  const waitingLine = waitingSeries(
    openRequests.map((r) => ({ createdAt: r.createdAt, firstInterestAt: r.interests[0]?.createdAt ?? null })),
    TREND_DAYS,
    UNANSWERED_AFTER_DAYS,
    now,
  );

  const newThisWeek = signups.filter((u) => u.createdAt >= since7).length;
  const newWeekBefore = signups.filter((u) => u.createdAt >= since14 && u.createdAt < since7).length;
  const active = distinctBetween(events, since7, now);
  const activeBefore = distinctBetween(events, since14, new Date(since7.getTime() - 1));

  return {
    users: { total: totalUsers, delta: newThisWeek, before: newWeekBefore, series: usersSeries },
    active: { value: active, delta: active - activeBefore, series: activeSeries },
    founding: { brands: foundingBrands, creators: foundingCreators, delta: movedOver(foundingSeries, 7), series: foundingSeries },
    waiting: { value: waitingLine[waitingLine.length - 1].value, delta: movedOver(waitingLine, 7), series: waitingLine },
  };
}
