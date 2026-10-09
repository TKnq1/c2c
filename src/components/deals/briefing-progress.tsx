"use client";

import { MILESTONES, type Milestone } from "@/lib/compliance/briefing-progress";
import { cardClass } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";

const SIZE = 56;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// How far the briefing is, as a ring that fills and five named steps that tick over. The ring moves with every keystroke, so
// writing the key message is the visible last step to "all clear".
export function BriefingProgress({ done, total, percent, milestones }: { done: number; total: number; percent: number; milestones: Record<Milestone, boolean> }) {
  const u = useDealText();
  const ready = done === total;
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
            className="stroke-ink transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{ready ? "✓" : `${percent}%`}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{ready ? u("briefing.progress.ready") : u("briefing.progress.title", { done, total })}</p>
        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {MILESTONES.map((m) => (
            <li key={m} className={`flex items-center gap-1 transition-colors ${milestones[m] ? "font-medium text-ink" : "text-neutral-500 dark:text-neutral-400"}`}>
              <span aria-hidden>{milestones[m] ? "✓" : "○"}</span>
              {u(`briefing.progress.${m}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
