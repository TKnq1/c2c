import type { ReactNode } from "react";
import type { FieldIssue } from "@/lib/deals/action-state";

// The few shapes every deal screen is built from, in the app's monochrome look.

export const cardClass = "rounded bg-fog p-4";
export const primaryButton =
  "rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50";
export const secondaryButton =
  "rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 disabled:opacity-50 dark:border-neutral-700";
export const quietButton = "text-xs text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400";
// text-base on phones: iOS zooms into any field under 16px on focus.
export const inputClass =
  "w-full rounded border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700";

export function Section({
  title,
  description,
  action,
  id,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-2">
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="text-footnote text-neutral-500 dark:text-neutral-400">{title}</h2>
          {description && <p className="mt-0.5 text-footnote text-neutral-500 dark:text-neutral-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  issues,
  name,
  children,
}: {
  label: string;
  hint?: string;
  issues?: FieldIssue[];
  name?: string;
  children: ReactNode;
}) {
  const mine = name ? (issues ?? []).filter((i) => i.field === name) : [];
  return (
    <label className="flex flex-col gap-1" data-issue-field={name && issues ? name : undefined}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>}
      {mine.map((i) => (
        <span key={i.code + i.message} className="text-xs font-medium text-ink">
          {i.severity === "error" ? "✕ " : "! "}
          {i.message}
        </span>
      ))}
    </label>
  );
}

// Every finding of a check, errors first. Monochrome by design: the sign in front tells error from warning.
export function IssueList({ issues, skipFields = false }: { issues?: FieldIssue[]; skipFields?: boolean }) {
  const shown = (issues ?? []).filter((i) => !(skipFields && i.field));
  if (shown.length === 0) return null;
  const sorted = [...shown].sort((a, b) => Number(b.severity === "error") - Number(a.severity === "error"));
  return (
    <ul className="flex flex-col gap-1 rounded border border-neutral-300 p-3 text-sm dark:border-neutral-700" role="alert">
      {sorted.map((i) => (
        <li key={i.code + i.message} className="flex gap-2">
          <span aria-hidden className="shrink-0 font-bold">
            {i.severity === "error" ? "✕" : "!"}
          </span>
          <span className={i.severity === "error" ? "font-medium" : "text-neutral-600 dark:text-neutral-400"}>{i.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function Badge({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        strong ? "bg-ink text-paper" : "border border-neutral-300 dark:border-neutral-700"
      }`}
    >
      {children}
    </span>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="min-w-0 text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}
