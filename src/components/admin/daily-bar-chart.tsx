"use client";

import { useState } from "react";
import { formatDay, formatValue, niceMax, type DailyPoint } from "@/lib/admin-chart";
import { ChartTable } from "@/components/admin/chart-table";

export type { DailyPoint };

const HEIGHT = 140;
const AXIS_GAP = 20;
const BAR_GAP = 2;
const MAX_BAR_WIDTH = 24;

// One series of daily columns in the accent colour. Hover a day for its
// exact value; the visually hidden table carries every value for screen
// readers and keyboard users.
export function DailyBarChart({
  title,
  points,
  unit,
  total,
}: {
  title: string;
  points: DailyPoint[];
  unit: "count" | "cents";
  total: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(Math.max(...points.map((p) => p.value)));
  const slot = 100 / points.length;
  const shown = active === null ? null : points[active];

  return (
    <figure className="adm-card flex min-w-0 flex-col gap-3 p-5">
      <figcaption className="flex flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-footnote tabular-nums text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {shown ? `${formatDay(shown.day)}: ${formatValue(shown.value, unit)}` : total}
        </span>
      </figcaption>

      <div className="relative mt-4" style={{ height: HEIGHT + AXIS_GAP }} onMouseLeave={() => setActive(null)}>
        {/* Top gridline with its value, and the baseline. */}
        <div className="absolute inset-x-0 top-0 border-t border-ink/10" aria-hidden />
        <span
          className="absolute right-0 -top-0.5 -translate-y-full text-caption-2 tabular-nums text-neutral-500 dark:text-neutral-400"
          aria-hidden
        >
          {formatValue(top, unit)}
        </span>
        <div className="absolute inset-x-0 border-t border-ink/20" style={{ top: HEIGHT }} aria-hidden />

        <div className="absolute inset-x-0 top-0 flex" style={{ height: HEIGHT }} aria-hidden>
          {points.map((p, i) => {
            const barHeight = p.value === 0 ? 0 : Math.max(2, (p.value / top) * HEIGHT);
            return (
              <div
                key={p.day}
                className="relative flex h-full items-end justify-center"
                style={{ width: `${slot}%`, paddingInline: BAR_GAP / 2 }}
                onMouseEnter={() => setActive(i)}
              >
                <div
                  className={`w-full rounded-t-[4px] bg-accent transition-opacity ${
                    active === null || active === i ? "" : "opacity-30"
                  }`}
                  style={{ height: barHeight, maxWidth: MAX_BAR_WIDTH }}
                />
              </div>
            );
          })}
        </div>

        <div
          className="absolute inset-x-0 flex justify-between text-caption-2 text-neutral-500 dark:text-neutral-400"
          style={{ top: HEIGHT + 6 }}
          aria-hidden
        >
          <span>{formatDay(points[0].day)}</span>
          <span>{formatDay(points[points.length - 1].day)}</span>
        </div>
      </div>

      <ChartTable caption={title} head={["Tag", "Wert"]} rows={points.map((p) => [formatDay(p.day), formatValue(p.value, unit)])} />
    </figure>
  );
}
