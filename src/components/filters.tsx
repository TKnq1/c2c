"use client";

import { useState } from "react";
import Link from "next/link";
import { IoChevronDown, IoClose, IoOptionsOutline, IoStar, IoStarOutline } from "react-icons/io5";
import { Dialog } from "@/components/dialog";

// One look for every filter in the app, brand and creator side alike: status filters as a row of pills (Deals,
// Requests, Matches), and on the pages with a search (Discover, Messages) a Filter button next to the search that opens
// the filter sheet: a bottom sheet on phones, a panel hanging under the button on desktop. The pills inside are the same pills,
// and on desktop the filters that are on also stand under the search as chips that take them off again.

export const searchFieldClass = "min-h-11 border-transparent bg-fog dark:border-transparent";

export function filterChipClass(active: boolean): string {
  return `inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition ${
    active
      ? "bg-ink text-paper"
      : "border border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
  }`;
}

// A pill: a link where the filter lives in the address (?filter=…), a button where it is state.
export function FilterChip({
  active,
  href,
  onClick,
  count,
  children,
}: {
  active: boolean;
  href?: string;
  onClick?: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  const content = (
    <>
      {children}
      {count !== undefined && <span className={`tabular-nums ${active ? "text-paper/70" : "text-neutral-500 dark:text-neutral-400"}`}>{count}</span>}
    </>
  );
  if (href) {
    return (
      <Link href={href} prefetch={false} aria-current={active ? "true" : undefined} className={filterChipClass(active)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={filterChipClass(active)}>
      {content}
    </button>
  );
}

// A row of pills; wraps onto a second line rather than scrolling sideways.
export function FilterChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </nav>
  );
}

// Where the desktop panel hangs: just under the Filter button, right edges aligned (px from the viewport's top and right).
export type FilterAnchor = { top: number; right: number };

// Open/closed state of one filter sheet, and the spot of the button that opened it.
export function useFilterSheet() {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<FilterAnchor | null>(null);
  return {
    open,
    anchor,
    show: (at: FilterAnchor) => {
      setAnchor(at);
      setOpen(true);
    },
    hide: () => setOpen(false),
  };
}

// The button beside a search that opens the filter sheet, with how many filters are on.
export function FilterButton({ count, label, activeLabel, onClick }: { count: number; label: string; activeLabel: string; onClick: (anchor: FilterAnchor) => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onClick({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }}
      aria-label={count > 0 ? activeLabel : label}
      className="relative flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded border border-neutral-300 px-3 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
    >
      <IoOptionsOutline className="h-5 w-5" aria-hidden />
      <span className="hidden md:inline">{label}</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-paper">
          {count}
        </span>
      )}
    </button>
  );
}

// The sheet behind the Filter button: groups of pills, and at its foot "Reset" and the button that shows the results.
export function FilterSheet({
  open,
  onClose,
  title,
  resetLabel,
  onReset,
  showLabel,
  anchor,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  // The Filter button's spot (see useFilterSheet): from md up the sheet hangs under it. `wide`: groups in two columns.
  anchor?: FilterAnchor | null;
  wide?: boolean;
  resetLabel: string;
  onReset: () => void;
  // "Show 5 creators": the filters apply at once, this closes the sheet on the result.
  showLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} anchor={anchor} wide={wide}>
      <div className={`flex flex-col gap-4 ${wide ? "md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-5" : ""}`}>{children}</div>
      {/* Sticks to the sheet's bottom edge on phones, over the sheet's own bottom padding (the home indicator's room), so
          nothing scrolls by underneath it. */}
      <div className="sticky -mx-5 -mb-[max(var(--safe-bottom),20px)] bottom-[calc(-1*max(var(--safe-bottom),20px))] flex items-center gap-3 border-t border-ink/10 bg-background px-5 pt-3 pb-[calc(0.75rem+max(var(--safe-bottom),20px))] md:static md:m-0 md:border-0 md:p-0">
        <button type="button" onClick={onReset} className="min-h-11 shrink-0 px-1 text-sm font-medium underline">
          {resetLabel}
        </button>
        <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-full bg-ink px-4 text-sm font-medium text-paper transition hover:bg-graphite">
          {showLabel}
        </button>
      </div>
    </Dialog>
  );
}

// `span`: across both columns of a wide sheet (a group with many pills).
export function FilterGroup({ label, span = false, children }: { label: string; span?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className={`flex flex-col gap-2 ${span ? "md:col-span-2" : ""}`}>
      <legend className="mb-2 text-footnote font-medium text-neutral-600 dark:text-neutral-400">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

// The sort order as one line of text with a chevron; the native picker opens over it (a wheel on phones).
export function SortMenu({
  value,
  options,
  onChange,
  label,
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <label className={`relative flex min-h-11 shrink-0 cursor-pointer items-center gap-1 text-sm font-medium ${className}`}>
      <span className="sr-only">{label}</span>
      <span aria-hidden>{current?.label}</span>
      <IoChevronDown className="h-3.5 w-3.5" aria-hidden />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// The filters that are on, as chips under the search (desktop; on phones the Filter button's badge says it). Each chip takes
// its filter off again.
export function AppliedFilters({ items, removeLabel }: { items: { key: string; label: string; onRemove: () => void }[]; removeLabel: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="hidden flex-wrap gap-2 md:flex">
      {items.map((item) => (
        <li key={item.key} className="inline-flex h-9 items-center gap-0.5 rounded-full bg-fog pl-3.5 pr-1 text-sm font-medium">
          {item.label}
          <button
            type="button"
            onClick={item.onRemove}
            aria-label={`${removeLabel}: ${item.label}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-ink/10 hover:text-ink dark:text-neutral-400"
          >
            <IoClose className="h-4 w-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

// "Saved only" among the filters, the same switch as the star in the page header. Spans both columns of a wide sheet.
export function FavoritesFilter({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex md:col-span-2">
      <FilterChip active={active} onClick={onToggle}>
        {active ? <IoStar className="h-4 w-4" aria-hidden /> : <IoStarOutline className="h-4 w-4" aria-hidden />}
        {label}
      </FilterChip>
    </div>
  );
}
