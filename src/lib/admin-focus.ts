import type { AdminTaskPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { percentChange } from "@/lib/admin-dashboard";
import { activeUserIds } from "@/lib/admin-growth";

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

// The four headline figures: growth. Cheap counts only, so the top of the page never waits for the heavy blocks below it.
export async function loadFocus(now = new Date()) {
  const since7 = new Date(now.getTime() - 7 * DAY);
  const since14 = new Date(now.getTime() - 14 * DAY);
  const people = { role: { in: ["STARTUP", "CREATOR"] as ("STARTUP" | "CREATOR")[] }, deletedAt: null };

  const [new7, newPrev7, totalUsers, active, foundingBrands, foundingCreators, unanswered] = await Promise.all([
    prisma.user.count({ where: { ...people, createdAt: { gte: since7 } } }),
    prisma.user.count({ where: { ...people, createdAt: { gte: since14, lt: since7 } } }),
    prisma.user.count({ where: people }),
    activeUserIds(since7),
    prisma.startupProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.creatorProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.request.count({
      where: { status: "OPEN", closedByAdmin: false, createdAt: { lt: new Date(now.getTime() - UNANSWERED_AFTER_DAYS * DAY) }, interests: { none: {} } },
    }),
  ]);

  return { new7, change7: percentChange(new7, newPrev7), totalUsers, active7: active.size, foundingBrands, foundingCreators, unanswered };
}
