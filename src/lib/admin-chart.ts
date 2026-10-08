import { formatCents } from "@/lib/format";

export type DailyPoint = { day: string; value: number };

export function formatValue(value: number, unit: "count" | "cents") {
  return unit === "cents" ? formatCents(value) : value.toLocaleString("de-DE");
}

export function formatDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "UTC" });
}

// Rounds the top of the scale up to 1/2/5 × 10^n so the one gridline label is a clean number.
export function niceMax(max: number) {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((s) => s * magnitude >= max)!;
  return step * magnitude;
}
