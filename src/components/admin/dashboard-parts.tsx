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
