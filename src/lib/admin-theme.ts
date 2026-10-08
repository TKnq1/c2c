// The accent colour of the admin dashboard: data marks, progress and the active page. Each accent has a step for the
// light surface and one for the dark one, taken from a palette checked for contrast and colour-blind safety, so
// switching accent never makes a chart unreadable. Everything else on the page stays in the app's greys.
export const ACCENTS = {
  green: { label: "Grün", light: "#0b7d55", dark: "#25a874" },
  blue: { label: "Blau", light: "#2a78d6", dark: "#3987e5" },
  violet: { label: "Violett", light: "#4a3aa7", dark: "#9085e9" },
  orange: { label: "Orange", light: "#eb6834", dark: "#d95926" },
  rose: { label: "Rosa", light: "#c2417a", dark: "#d55181" },
  graphite: { label: "Grau", light: "#52514e", dark: "#a2a2a9" },
} as const;

export type AccentKey = keyof typeof ACCENTS;
export const ACCENT_KEYS = Object.keys(ACCENTS) as AccentKey[];
export const DEFAULT_ACCENT: AccentKey = "blue";

export function parseAccent(value: unknown): AccentKey {
  return typeof value === "string" && value in ACCENTS ? (value as AccentKey) : DEFAULT_ACCENT;
}

function luminance(hex: string) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

// Text on an accent fill: white or near-black, whichever reads better.
export function onAccent(hex: string): "#ffffff" | "#070707" {
  const l = luminance(hex);
  const withWhite = 1.05 / (l + 0.05);
  const withInk = (l + 0.05) / (luminance("#070707") + 0.05);
  return withWhite >= withInk ? "#ffffff" : "#070707";
}

// The variables .admin-shell reads. Built only from the fixed table above, so nothing a person typed ends up in CSS.
export function accentCss(key: AccentKey): string {
  const { light, dark } = ACCENTS[key];
  return `.admin-shell{--accent:${light};--on-accent:${onAccent(light)}}.dark .admin-shell{--accent:${dark};--on-accent:${onAccent(dark)}}`;
}
