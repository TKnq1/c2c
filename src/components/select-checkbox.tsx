"use client";

import { IoCheckmark } from "react-icons/io5";

// The tick box for picking rows of a list: a 20px box with a visible tick inside a 44px tap area, so it can be hit
// with a thumb next to a row that opens on tap.
export function SelectCheckbox({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}) {
  return (
    <label className={`relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center ${className}`} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="peer sr-only" />
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center rounded border border-neutral-400 bg-background text-paper transition peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 dark:border-neutral-500"
      >
        {checked && <IoCheckmark className="h-3.5 w-3.5" />}
      </span>
    </label>
  );
}
