const DAY = 24 * 60 * 60 * 1000;
// The pace is measured over the last four weeks: long enough to smooth out a single busy day.
export const PACE_DAYS = 28;
const LONGEST_FORECAST_DAYS = 2 * 365;

export type Forecast = { kind: "reached" } | { kind: "none" } | { kind: "far" } | { kind: "date"; date: Date; days: number };

// When a goal is reached if the pace of the last weeks stays: the places still missing divided by the places gained per day.
export function forecastGoal(input: { current: number; goal: number; gainedInPaceWindow: number }, now: Date): Forecast {
  const { current, goal, gainedInPaceWindow } = input;
  if (current >= goal) return { kind: "reached" };
  const perDay = gainedInPaceWindow / PACE_DAYS;
  if (perDay <= 0) return { kind: "none" };
  const days = Math.ceil((goal - current) / perDay);
  if (days > LONGEST_FORECAST_DAYS) return { kind: "far" };
  return { kind: "date", date: new Date(now.getTime() + days * DAY), days };
}

export function forecastText(f: Forecast): string {
  switch (f.kind) {
    case "reached":
      return "Ziel erreicht";
    case "none":
      return "Kein Tempo in den letzten 4 Wochen";
    case "far":
      return "Bei diesem Tempo in über 2 Jahren";
    case "date":
      return `Bei diesem Tempo am ${f.date.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" })}`;
  }
}
