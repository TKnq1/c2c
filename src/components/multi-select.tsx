"use client";

import { useEffect, useRef, useState } from "react";
import { useExitAnimation } from "@/lib/use-exit-animation";

type Props = {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  wrapperClassName?: string;
};

// Same markup and classes as <Select> (native single-value dropdown) so the
// two sit flush in a filter row — just a checkbox panel instead of the
// native options list, since a plain <select> can't hold more than one
// value.
export function MultiSelect({ label, options, selected, onChange, wrapperClassName = "" }: Props) {
  const [open, setOpen] = useState(false);
  const panel = useExitAnimation(open);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
  }

  const buttonLabel =
    selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={ref} className={`relative ${wrapperClassName}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="w-full appearance-none rounded-[14px] border border-neutral-300 bg-white text-neutral-900 pl-3 pr-9 py-2 text-left truncate dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        {buttonLabel}
      </button>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {panel.present && (
        <div
          role="listbox"
          aria-multiselectable="true"
          onAnimationEnd={panel.onExitEnd}
          className={`${
            panel.closing ? "animate-dropdown-out pointer-events-none" : "animate-dropdown-in"
          } absolute z-20 mt-1 min-w-48 max-h-96 overflow-y-auto rounded-[14px] border border-ink/10 bg-white py-1 dark:bg-neutral-900`}
        >
          {options.map((o) => (
            <label
              key={o}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 cursor-pointer dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={() => toggle(o)}
                className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
              />
              {o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
