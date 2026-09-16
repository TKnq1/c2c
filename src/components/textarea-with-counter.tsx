"use client";

import { useState } from "react";

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "maxLength"> & { maxLength: number };

// Drop-in replacement for a plain <textarea> — same props, adds a live
// character counter. Needs to be controlled to know the current length, so
// `defaultValue` (not `value`) seeds the initial text.
export function TextareaWithCounter({ maxLength, defaultValue = "", className, ...props }: Props) {
  const [value, setValue] = useState(String(defaultValue));
  const remaining = maxLength - value.length;

  return (
    <div className="flex flex-col gap-1">
      <textarea
        {...props}
        maxLength={maxLength}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={className}
      />
      <span className={`text-xs self-end ${remaining <= maxLength * 0.1 ? "text-ink" : "text-neutral-400 dark:text-neutral-500"}`}>
        {value.length}/{maxLength}
      </span>
    </div>
  );
}
