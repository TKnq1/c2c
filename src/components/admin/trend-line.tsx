"use client";

import { useId, useState } from "react";
import type { TrendPoint } from "@/lib/admin-trends";
import { smoothPath } from "@/lib/smooth-path";

const W = 300;
const H = 64;
const PAD_X = 6;
const PAD_Y = 9;

const formatDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "UTC" });

// A smooth line of the last days under a headline figure, with a soft area under it. The scale
// runs from the lowest to the highest point, so it shows the shape, not the size (the exact values come on hover or touch).
// The last point is the figure shown above it.
export function TrendLine({ points, previous, label }: { points: TrendPoint[]; previous?: TrendPoint[]; label: string }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;

  // The period before is only drawn when it has the same length, so point i of both lines is the same day of its period.
  const before = previous && previous.length === points.length ? previous : null;
  const values = [...points, ...(before ?? [])].map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => PAD_X + (i * (W - 2 * PAD_X)) / (points.length - 1);
  // A line that never moves sits in the middle instead of on the floor.
  const y = (v: number) => (max === min ? H / 2 : H - PAD_Y - ((v - min) / (max - min)) * (H - 2 * PAD_Y));
  const shown = hover ?? points.length - 1;
  const first = points[0];
  const last = points[points.length - 1];
  const line = smoothPath(points.map((p, i) => [x(i), y(p.value)]));
  const lineBefore = before ? smoothPath(before.map((p, i) => [x(i), y(p.value)])) : null;

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
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.34 }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {lineBefore && <path d={lineBefore} fill="none" className="stroke-ink/30" strokeWidth={1.4} strokeDasharray="4 4" strokeLinecap="round" />}
        <path d={`${line} L${x(points.length - 1)} ${H} L${x(0)} ${H} Z`} fill={`url(#${id}-fill)`} />
        <path d={line} fill="none" className="stroke-accent" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && <line x1={x(shown)} x2={x(shown)} y1={2} y2={H - 1} className="stroke-ink/20" />}
        <circle cx={x(shown)} cy={y(points[shown].value)} r={4} className="fill-accent" style={{ stroke: "var(--adm-card)" }} strokeWidth={2} />
      </svg>
      <figcaption className="flex items-center justify-between gap-2 text-[0.6875rem] whitespace-nowrap text-neutral-500 tabular-nums">
        {hover === null ? (
          <>
            <span>{formatDay(first.day)}</span>
            {before && (
              <span className="inline-flex items-center gap-1.5" title="Zeitraum davor">
                <svg width="16" height="4" aria-hidden>
                  <line x1="0" x2="16" y1="2" y2="2" className="stroke-ink/40" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
                davor
              </span>
            )}
            <span>heute</span>
          </>
        ) : (
          <span className="font-bold text-neutral-700 dark:text-neutral-300">
            {formatDay(points[shown].day)}: {points[shown].value.toLocaleString("de-DE")}
            {before && <span className="font-normal text-neutral-500"> · davor {before[shown].value.toLocaleString("de-DE")}</span>}
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
