"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/admin-trends";

const W = 300;
const H = 52;
const PAD_X = 4;
const PAD_Y = 7;

const formatDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "UTC" });

// A thin line of the last days under a headline figure. The scale runs from the lowest to the highest point, so it shows
// the shape, not the size (the exact values come on hover or touch). The last point is the figure shown above it.
export function TrendLine({ points, label }: { points: TrendPoint[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => PAD_X + (i * (W - 2 * PAD_X)) / (points.length - 1);
  // A line that never moves sits in the middle instead of on the floor.
  const y = (v: number) => (max === min ? H / 2 : H - PAD_Y - ((v - min) / (max - min)) * (H - 2 * PAD_Y));
  const shown = hover ?? points.length - 1;
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <figure className="mt-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y"
        role="img"
        aria-label={`${label}: von ${first.value.toLocaleString("de-DE")} auf ${last.value.toLocaleString("de-DE")} in ${points.length} Tagen`}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const index = Math.round(((e.clientX - box.left) / box.width) * (points.length - 1));
          setHover(Math.min(points.length - 1, Math.max(0, index)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <line x1={PAD_X} x2={W - PAD_X} y1={H - 1} y2={H - 1} className="stroke-ink/10" />
        <polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} fill="none" className="stroke-accent" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && <line x1={x(shown)} x2={x(shown)} y1={2} y2={H - 1} className="stroke-ink/20" />}
        <circle cx={x(shown)} cy={y(points[shown].value)} r={4} className="fill-accent stroke-paper" strokeWidth={2} />
      </svg>
      <figcaption className="flex justify-between gap-2 text-[0.6875rem] text-neutral-500 tabular-nums">
        {hover === null ? (
          <>
            <span>{formatDay(first.day)}</span>
            <span>heute</span>
          </>
        ) : (
          <span className="font-bold text-neutral-700 dark:text-neutral-300">
            {formatDay(points[shown].day)}: {points[shown].value.toLocaleString("de-DE")}
          </span>
        )}
      </figcaption>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{formatDay(p.day)}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
