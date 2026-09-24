"use client";

import { useLayoutEffect, useState } from "react";
import { getPreferredTheme, setTheme } from "@/lib/theme";

// A live switch, not a form field with a Save button like the rest of this
// page (see NotificationPreferences) — dark mode should apply the instant
// you flip it, the same way it always has from the nav icon this replaces.
export function AppearanceSettings() {
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    // Deferred a tick to avoid a synchronous setState-in-effect — still
    // resolves before paint in practice, so there's no visible flash of the
    // switch starting in the wrong position.
    queueMicrotask(() => setDark(getPreferredTheme() === "dark"));
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setDark(next === "dark");
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Dark mode</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Applies immediately on this device.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Dark mode"
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${dark ? "bg-ink" : "bg-neutral-300 dark:bg-neutral-700"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-paper transition-transform ${dark ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
