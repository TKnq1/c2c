import Link from "next/link";
import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";
import type { FunnelStep } from "@/lib/admin-dashboard";

// A white panel with a hairline, the dashboard's basic building block.
export function DashCard({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded border border-ink/10 bg-paper p-[var(--pad,1.25rem)] ${className}`}>
      {title && (
        <h2 className="mb-3.5 flex items-center gap-2 text-footnote font-bold text-neutral-600 dark:text-neutral-400">
          {title}
          {right && <span className="ml-auto font-normal text-neutral-500">{right}</span>}
        </h2>
      )}
      {children}
    </section>
  );
}

// The shape of the last days at a glance: a thin line with the current value as a dot. No axes, it sits next to a number.
export function Sparkline({ values, width = 84, height = 30 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const pad = 3;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [pad + (i * (width - 2 * pad)) / (values.length - 1), height - pad - ((v - min) / span) * (height - 2 * pad)]);
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0">
      <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="currentColor" className="text-stone" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={4} className="fill-accent stroke-paper" strokeWidth={2} />
    </svg>
  );
}

// One headline figure: label, the number, how it moved against the 30 days before, and a note.
export function KpiTile({
  label,
  value,
  change,
  changeLabel = "zu den 30 Tagen davor",
  upIsGood = true,
  hint,
  trend,
  href,
}: {
  label: string;
  value: string;
  change?: number | null;
  changeLabel?: string;
  upIsGood?: boolean;
  hint?: React.ReactNode;
  trend?: number[];
  href?: string;
}) {
  const up = (change ?? 0) >= 0;
  const good = up === upIsGood;
  const Arrow = up ? FiArrowUpRight : FiArrowDownRight;
  const body = (
    <>
      <p className="text-footnote text-neutral-600 dark:text-neutral-400">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="font-display text-[1.875rem] leading-9 font-black tracking-tight">{value}</p>
        {trend && <Sparkline values={trend} />}
      </div>
      {change != null && (
        <p className="flex items-center gap-1 text-footnote text-neutral-600 dark:text-neutral-400">
          <Arrow className={`h-3.5 w-3.5 shrink-0 ${good ? "text-[#0ca30c]" : "text-[#d03b3b]"}`} aria-hidden />
          <span>
            {change > 0 ? "+" : ""}
            {change} % {changeLabel}
          </span>
        </p>
      )}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </>
  );
  const box = "flex flex-col gap-1.5 rounded border border-ink/10 bg-paper p-[var(--pad,1.25rem)]";
  return href ? (
    <Link href={href} className={`${box} transition hover:bg-fog`}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

// Progress toward a goal as a ring. Over 100 % the ring stays full and the number says how far.
export function GoalRing({ label, value, goal, display, sub }: { label: string; value: number; goal: number; display: string; sub: string }) {
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div className="relative h-[104px] w-[104px]">
        <svg viewBox="0 0 104 104" width="104" height="104" role="img" aria-label={`${label}: ${display}`}>
          <circle cx="52" cy="52" r={r} fill="none" strokeWidth="9" className="stroke-fog dark:stroke-ink/10" />
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className="stroke-accent"
            strokeDasharray={`${(c * percent) / 100} ${c}`}
            transform="rotate(-90 52 52)"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[1.0625rem] font-black tracking-tight">{display}</span>
      </div>
      <p className="text-sm font-bold">{label}</p>
      <p className="-mt-1.5 text-xs text-neutral-500">{sub}</p>
    </div>
  );
}

// Each bar is the share that gets through from the step before, so the longest gap is where the bar is shortest.
export function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {steps.map((step) => (
        <div key={step.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="font-bold">{step.label}</span>
            <span className="shrink-0 text-neutral-600 tabular-nums dark:text-neutral-400">
              {step.count.toLocaleString("de-DE")}
              {step.shareOfPrevious !== null && ` · ${step.shareOfPrevious} %`}
            </span>
          </div>
          <div className="h-3.5 rounded-[3px] bg-fog">
            <div className="h-full rounded-r-[4px] bg-accent" style={{ width: `${step.shareOfPrevious ?? 100}%`, minWidth: step.count > 0 ? 4 : 0 }} />
          </div>
        </div>
      ))}
      <p className="text-xs text-neutral-500">Jeder Balken zeigt, wie viele vom Schritt davor ankommen.</p>
    </div>
  );
}

// A page's title with a short line under it, and optional controls on the right.
export function PageHeader({ title, sub, right }: { title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pr-0 group-data-[panel=closed]/shell:lg:pr-28">
      <div>
        <h1 className="font-display text-title-1 font-black">{title}</h1>
        {sub && <p className="mt-0.5 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// A number with a line of explanation under it.
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-[1.375rem] leading-7 font-black tracking-tight">{value}</p>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">{label}</p>
    </div>
  );
}

// A few labelled columns, one per month (or any step). Value labels sit on the cap; bars are capped at 28px wide with a
// 4px rounded top, like the daily chart.
export function ColumnChart({ points, format }: { points: { label: string; value: number }[]; format: (value: number) => string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const height = 130;
  return (
    <figure>
      <div className="flex items-end gap-2" style={{ height: height + 22 }}>
        {points.map((p) => {
          const h = p.value === 0 ? 0 : Math.max(2, (p.value / max) * height);
          return (
            <div key={p.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[0.6875rem] text-neutral-600 tabular-nums dark:text-neutral-400">{p.value > 0 ? format(p.value) : ""}</span>
              <div className="w-full rounded-t-[4px] bg-accent" style={{ height: h, maxWidth: 28 }} />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2 border-t border-ink/20 pt-1.5">
        {points.map((p) => (
          <span key={p.label} className="min-w-0 flex-1 truncate text-center text-[0.6875rem] text-neutral-500">
            {p.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <td>{p.label}</td>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// A thin line with the latest value as a dot and light horizontal guides, for a balance over time.
export function LineChart({ points, format }: { points: { label: string; value: number }[]; format: (value: number) => string }) {
  if (points.length < 2) return <p className="text-sm text-neutral-500">Noch zu wenige Werte für einen Verlauf.</p>;
  const w = 520;
  const h = 150;
  const left = 8;
  const right = 12;
  const top = 10;
  const bottom = 22;
  const values = points.map((p) => p.value);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const x = (i: number) => left + (i * (w - left - right)) / (points.length - 1);
  const y = (v: number) => top + (h - top - bottom) - ((v - min) / (max - min || 1)) * (h - top - bottom);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={`Verlauf, zuletzt ${format(last.value)}`}>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={left} x2={w - right} y1={top + f * (h - top - bottom)} y2={top + f * (h - top - bottom)} className="stroke-ink/10" />
        ))}
        <polyline points={line} fill="none" className="stroke-accent" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(points.length - 1)} cy={y(last.value)} r={4} className="fill-accent stroke-paper" strokeWidth={2} />
        {points.map((p, i) =>
          i === 0 || i === points.length - 1 || points.length <= 6 ? (
            <text key={p.label + i} x={x(i)} y={h - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-neutral-500 text-[0.6875rem]">
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="text-xs text-neutral-500">Zuletzt {format(last.value)}</figcaption>
    </figure>
  );
}

// The table every list on the dashboard uses: small grey headings, hairline rows.
export function DataTable({ head, children }: { head: { label: string; right?: boolean; hideSmall?: boolean }[]; children: React.ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className={`w-full border-collapse text-sm ${head.length > 4 ? "min-w-[32rem]" : ""}`}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h.label} className={`border-b border-ink/10 pr-4 pb-2 text-xs font-normal text-graphite ${h.right ? "text-right" : "text-left"}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-ink/10 [&_td]:py-2.5 [&_td]:pr-4 [&_tr:last-child_td]:border-b-0">{children}</tbody>
      </table>
    </div>
  );
}

export const money = (cents: number) =>
  `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })} €`;

// Horizontal bars for a share of a whole (where people heard of us, signups per channel): the widest is the full width.
export function ShareBars({ items }: { items: { label: string; value: number; text?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="font-bold">{item.label}</span>
            <span className="shrink-0 text-neutral-600 tabular-nums dark:text-neutral-400">{item.text ?? item.value.toLocaleString("de-DE")}</span>
          </div>
          <div className="h-3 rounded-[3px] bg-fog">
            <div className="h-full rounded-r-[4px] bg-accent" style={{ width: `${(item.value / max) * 100}%`, minWidth: item.value > 0 ? 4 : 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
