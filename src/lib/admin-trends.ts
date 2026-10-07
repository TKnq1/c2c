// The 30-day lines behind the four headline figures on "Heute". Pure functions over rows that are already loaded, so the
// maths can be tested without a database. Days are UTC days, like every other daily series on the dashboard.
const DAY = 24 * 60 * 60 * 1000;

export type TrendPoint = { day: string; value: number };

// One entry per day, oldest first. Each day is measured at its end, except today, which is measured at `now`: the last
// point of a line is therefore always the figure shown next to it.
export function dayEnds(days: number, now: Date): { day: string; end: Date }[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, i) => {
    const start = today - (days - 1 - i) * DAY;
    return { day: new Date(start).toISOString().slice(0, 10), end: new Date(Math.min(start + DAY - 1, now.getTime())) };
  });
}

export type ActivityEvent = { userId: string; at: Date };

export function distinctBetween(events: ActivityEvent[], from: Date, to: Date): number {
  const ids = new Set<string>();
  for (const e of events) if (e.at >= from && e.at <= to) ids.add(e.userId);
  return ids.size;
}

// People who did something in the `window` days up to each day's end (the "active in 7 days" figure, for every day).
export function rollingDistinct(events: ActivityEvent[], days: number, window: number, now: Date): TrendPoint[] {
  return dayEnds(days, now).map(({ day, end }) => ({ day, value: distinctBetween(events, new Date(end.getTime() - window * DAY), end) }));
}

// How many requests were waiting for a first interest, each day: older than `waitDays` and still without one at that time.
// Built from the requests that are open today, so a request closed since then is not counted in the past.
export function waitingSeries(requests: { createdAt: Date; firstInterestAt: Date | null }[], days: number, waitDays: number, now: Date): TrendPoint[] {
  return dayEnds(days, now).map(({ day, end }) => ({
    day,
    value: requests.filter((r) => r.createdAt.getTime() <= end.getTime() - waitDays * DAY && (r.firstInterestAt === null || r.firstInterestAt > end)).length,
  }));
}

// A running total from dates: how many were there by the end of each day.
export function cumulativeFromDates(dates: Date[], days: number, now: Date): TrendPoint[] {
  return dayEnds(days, now).map(({ day, end }) => ({ day, value: dates.filter((d) => d <= end).length }));
}

// How much a line moved over the last `back` days (the last point against the one `back` points earlier).
export function movedOver(series: TrendPoint[], back: number): number {
  if (series.length === 0) return 0;
  const earlier = series[Math.max(0, series.length - 1 - back)].value;
  return series[series.length - 1].value - earlier;
}

// The running total behind a daily count: today's total minus what the window added, plus each day on top.
export function runningTotal(daily: TrendPoint[], endTotal: number): TrendPoint[] {
  let running = endTotal - daily.reduce((sum, p) => sum + p.value, 0);
  return daily.map((p) => ({ day: p.day, value: (running += p.value) }));
}
