// When the morning start shows. Pure, so the rules can be tested; the browser supplies the clock and what it remembers.

// from <= hour < to, on the viewer's own clock. A window that ends before it starts matches nothing.
export function inMorningWindow(hour: number, from: number, to: number): boolean {
  return from < to && hour >= from && hour < to;
}

// The viewer's calendar day, "YYYY-MM-DD" (not UTC: "once a day" means once per local morning).
export function localDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function shouldShowMorningStart(input: {
  enabled: boolean;
  from: number;
  to: number;
  everyTime: boolean;
  now: Date;
  lastShownDay: string | null;
  shownThisVisit: boolean;
}): boolean {
  if (!input.enabled || input.shownThisVisit) return false;
  if (!inMorningWindow(input.now.getHours(), input.from, input.to)) return false;
  return input.everyTime || input.lastShownDay !== localDayKey(input.now);
}
