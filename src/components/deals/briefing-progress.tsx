"use client";

import { useState } from "react";
import { MILESTONES, type Milestone } from "@/lib/compliance/briefing-progress";
import { cardClass } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";

const SIZE = 56;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// How far the briefing is, as a ring that fills and five named steps that tick over. The ring moves with every keystroke, so
// writing the key message is the visible last step to "all clear". A step that has just been completed snaps in: its check mark
// overshoots once and its line glows for a moment; what was already done when the page opened stays still.
export function BriefingProgress({ done, total, percent, milestones }: { done: number; total: number; percent: number; milestones: Record<Milestone, boolean> }) {
  const u = useDealText();
  const ready = done === total;

  // Which steps were done at the last render, and which of them became done just now. Set while rendering (the documented way to
  // react to a change of a prop): an effect would paint one frame without the animation first.
  const doneKey = MILESTONES.filter((m) => milestones[m]).join(",");
  const [seen, setSeen] = useState(doneKey);
  const [fresh, setFresh] = useState<Milestone[]>([]);
  const [justReady, setJustReady] = useState(false);
  if (seen !== doneKey) {
    const before = seen === "" ? [] : seen.split(",");
    setSeen(doneKey);
    setFresh(MILESTONES.filter((m) => milestones[m] && !before.includes(m)));
    setJustReady(ready && before.length < total);
  }

  return (
    <div className={`${cardClass} flex items-center gap-4`} role="status" aria-live="polite">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-ink/10" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            className="stroke-accent transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
          <span className={`${ready ? "text-accent" : ""} ${ready && justReady ? "animate-snap" : ""}`}>{ready ? "✓" : `${percent}%`}</span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{ready ? u("briefing.progress.ready") : u("briefing.progress.title", { done, total })}</p>
        <ul className="-ml-1.5 mt-1.5 flex flex-wrap gap-y-1 text-xs">
          {MILESTONES.map((m) => (
            <li
              key={m}
              className={`flex items-center gap-1 rounded-full px-1.5 transition-colors ${fresh.includes(m) && milestones[m] ? "animate-snap-glow" : ""} ${
                milestones[m] ? "font-medium text-ink" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <span aria-hidden className={`${milestones[m] ? "text-accent" : ""} ${fresh.includes(m) && milestones[m] ? "animate-snap" : ""}`}>
                {milestones[m] ? "✓" : "○"}
              </span>
              {u(`briefing.progress.${m}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
