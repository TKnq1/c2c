// Must match --paper's light/dark values in globals.css and the anti-FOUC
// script in layout.tsx.
const THEME_COLOR = { light: "#ffffff", dark: "#1e1e1e" };

export function getPreferredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // Private browsing / storage disabled — fall through to system preference.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Private browsing / storage disabled — theme just won't persist.
  }
}
