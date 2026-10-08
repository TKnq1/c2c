"use client";

import { useId, useState } from "react";
import { formatDay, formatValue, niceMax, type DailyPoint } from "@/lib/admin-chart";
import { smoothPath } from "@/lib/smooth-path";
import { ChartTable } from "@/components/admin/chart-table";

const HEIGHT = 168;
const AXIS_GAP = 22;
// The drawing is 100 units wide and stretched to the card; the strokes stay the same width (vector-effect).
const UNITS = 100;

// One series of daily values as a smooth line in the accent colour with a soft area under it. Hover or touch a day for its exact value; the visually hidden table carries every value for screen readers and keyboard
// users.
export function DailyLineChart({ title, points, unit, total }: { title: string; points: DailyPoint[]; unit: "count" | "cents"; total: string }) {
  const id = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(Math.max(...points.map((p) => p.value)));
  const slot = UNITS / points.length;
  const x = (i: number) => (i + 0.5) * slot;
  const y = (v: number) => HEIGHT - 6 - (v / top) * (HEIGHT - 12);
  const coords = points.map((p, i) => [x(i), y(p.value)] as [number, number]);
  const line = smoothPath(coords);
  const shown = active === null ? null : points[active];
  const labelIndexes = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (points.length - 1)));

  return (
    <figure className="adm-card flex min-w-0 flex-col gap-3 p-[var(--pad,1.25rem)]">
      <figcaption className="flex flex-col">
        <span className="font-display text-[1.0625rem] font-black">{title}</span>
        <span className="text-footnote tabular-nums text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {shown ? `${formatDay(shown.day)}: ${formatValue(shown.value, unit)}` : total}
        </span>
      </figcaption>

      <div className="relative mt-3" style={{ height: HEIGHT + AXIS_GAP }} onMouseLeave={() => setActive(null)}>
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-ink/10" aria-hidden />
        <span className="absolute right-0 -top-0.5 -translate-y-full text-caption-2 tabular-nums text-neutral-500 dark:text-neutral-400" aria-hidden>
          {formatValue(top, unit)}
        </span>
        <div className="absolute inset-x-0 border-t border-ink/20" style={{ top: HEIGHT }} aria-hidden />

        <svg
          viewBox={`0 0 ${UNITS} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-0 w-full overflow-visible"
          style={{ height: HEIGHT }}
          aria-hidden
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.4 }} />
              <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={`${line} L${x(points.length - 1)} ${HEIGHT} L${x(0)} ${HEIGHT} Z`} fill={`url(#${id}-fill)`} />
          <path d={line} fill="none" className="stroke-accent" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        <div className="absolute inset-x-0 top-0 flex" style={{ height: HEIGHT }} aria-hidden>
          {points.map((p, i) => (
            <div key={p.day} className="h-full" style={{ width: `${slot}%` }} onMouseEnter={() => setActive(i)} />
          ))}
        </div>

        {active !== null && shown && (
          <>
            <div className="pointer-events-none absolute top-0 w-px bg-ink/20" style={{ left: `${x(active)}%`, height: HEIGHT }} aria-hidden />
            <div
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-(--adm-card)"
              style={{ left: `${x(active)}%`, top: y(shown.value) }}
              aria-hidden
            />
          </>
        )}

        <div className="absolute inset-x-0 flex justify-between text-caption-2 text-neutral-500 dark:text-neutral-400" style={{ top: HEIGHT + 8 }} aria-hidden>
          {labelIndexes.map((i, k) => (
            <span key={k}>{formatDay(points[i].day)}</span>
          ))}
        </div>
      </div>

      <ChartTable caption={title} head={["Tag", "Wert"]} rows={points.map((p) => [formatDay(p.day), formatValue(p.value, unit)])} />
    </figure>
  );
}
