import type { DailyPoint } from "@/components/admin/daily-bar-chart";

const DAY_MS = 24 * 60 * 60 * 1000;

// Midnight UTC `days - 1` days ago, so the window covers today plus the
// days before it.
export function windowStart(days: number, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(today - (days - 1) * DAY_MS);
}

// Buckets rows into one point per UTC day across the window, including the
// days with nothing on them (a missing day would silently squeeze the axis).
export function dailySeries<T>(
  rows: T[],
  days: number,
  dateOf: (row: T) => Date | null,
  valueOf: (row: T) => number = () => 1,
  now = new Date(),
): DailyPoint[] {
  const start = windowStart(days, now).getTime();
  const values = new Array<number>(days).fill(0);
  for (const row of rows) {
    const date = dateOf(row);
    if (!date) continue;
    const index = Math.floor((date.getTime() - start) / DAY_MS);
    if (index >= 0 && index < days) values[index] += valueOf(row);
  }
  return values.map((value, i) => ({ day: new Date(start + i * DAY_MS).toISOString().slice(0, 10), value }));
}
