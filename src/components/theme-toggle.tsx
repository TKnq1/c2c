"use client";

import { useLayoutEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { getPreferredTheme, setTheme } from "@/lib/theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    // Safety net for React StrictMode's dev-mode remount, which clears the
    // .dark class the anti-FOUC inline script set on <html> before hydration
    // (see next/dist/docs/.../preventing-flash-before-hydration.md). Re-apply
    // synchronously, before paint, so there's no flash even after the remount.
    const theme = getPreferredTheme();
    setTheme(theme);
    queueMicrotask(() => setDark(theme === "dark"));
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setDark(next === "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition"
    >
      {dark ? <FiSun className="h-5 w-5 md:h-4 md:w-4" /> : <FiMoon className="h-5 w-5 md:h-4 md:w-4" />}
    </button>
  );
}
