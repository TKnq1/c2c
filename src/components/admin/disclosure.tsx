"use client";

import { useSyncExternalStore } from "react";
import { FiChevronDown } from "react-icons/fi";

const listeners = new Set<() => void>();
// What was chosen in this visit, so the toggle works even where storage is blocked.
const chosen = new Map<string, boolean>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

function read(key: string): boolean {
  const now = chosen.get(key);
  if (now !== undefined) return now;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function write(key: string, open: boolean) {
  chosen.set(key, open);
  try {
    localStorage.setItem(key, open ? "1" : "0");
  } catch {
    // The choice only lasts for this visit.
  }
  listeners.forEach((listener) => listener());
}

// A section that starts folded and remembers, per browser, whether it was left open. The content is rendered by the
// server either way; this only shows or hides it. The server always renders it folded; the browser's choice takes over
// right after hydration (useSyncExternalStore, so no hydration mismatch).
export function Disclosure({ title, hint, storageKey, children }: { title: string; hint: string; storageKey: string; children: React.ReactNode }) {
  const open = useSyncExternalStore(subscribe, () => read(storageKey), () => false);
  const toggle = () => write(storageKey, !open);

  return (
    <section>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`${storageKey}-content`}
        className="flex w-full items-center gap-3 rounded border border-ink/10 bg-paper px-[var(--pad,1.25rem)] py-3 text-left transition hover:bg-fog"
      >
        <span className="font-display text-base font-black">{title}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-neutral-600 dark:text-neutral-400">{open ? "" : hint}</span>
        <FiChevronDown className={`h-5 w-5 shrink-0 text-graphite transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id={`${storageKey}-content`} hidden={!open} className="mt-[var(--gap,1rem)]">
        {children}
      </div>
    </section>
  );
}
