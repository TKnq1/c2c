import type { AdminTaskPriority } from "@prisma/client";

// How many open tasks the top of "Heute" shows; the rest sits behind a link.
export const FOCUS_SHOWN = 3;

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
