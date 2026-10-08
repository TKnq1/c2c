// The daily plan on "Heute": fixed habits for content, outreach and the numbers, by weekday. The things that wait in
// the data (reports, disputes, founding mails ...) are not here: those are the checks in src/lib/admin-tasks.ts.
// Pure, so it can be tested without a database.

export type RoutineArea = "content" | "growth" | "numbers";

// 0 = Sunday ... 6 = Saturday, as Date.getDay().
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Routine = {
  key: string;
  area: RoutineArea;
  label: string;
  // Only on these weekdays; every day when unset.
  days?: Weekday[];
  // Only on this day of the month.
  monthDay?: number;
  href?: string;
};

export const AREA_LABEL: Record<RoutineArea, string> = {
  content: "Content & Social Media",
  growth: "Wachstum & Outreach",
  numbers: "Zahlen",
};

const MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6, SUN = 0;

export const ROUTINES: Routine[] = [
  { key: "content.story", area: "content", label: "1 Story posten" },
  { key: "content.replies", area: "content", label: "Kommentare und DMs auf Instagram und TikTok beantworten (15 Min.)" },
  { key: "content.engage", area: "content", label: "10 Minuten mit Accounts aus der Zielgruppe interagieren" },
  { key: "content.plan", area: "content", label: "Content-Plan für die Woche festlegen, 3 Hooks schreiben", days: [MON] },
  { key: "content.reel-creator", area: "content", label: "Reel/TikTok für Creator drehen und posten", days: [TUE, THU] },
  { key: "content.carousel-brand", area: "content", label: "Karussell für Marken posten", days: [WED] },
  { key: "content.reel-brand", area: "content", label: "Reel für Marken posten, Woche in Stories zusammenfassen", days: [FRI] },
  { key: "content.repost", area: "content", label: "Post von einem Creator oder einer Marke reposten", days: [SAT] },
  { key: "content.batch", area: "content", label: "Content für nächste Woche vorproduzieren", days: [SUN] },

  { key: "growth.brands", area: "growth", label: "5 passende Marken anschreiben" },
  { key: "growth.creators", area: "growth", label: "5 Creator anschreiben" },
  { key: "growth.follow-up", area: "growth", label: "Auf Antworten nachfassen" },
  { key: "growth.mailing", area: "growth", label: "Mailing an Founding-Interessenten planen", days: [MON], href: "/admin/mailing" },
  { key: "growth.partner", area: "growth", label: "1 Kooperation anfragen (Agentur, Community, Podcast)", days: [WED] },
  { key: "growth.welcome", area: "growth", label: "Neue Nutzer der Woche persönlich begrüßen", days: [FRI], href: "/admin/users" },

  { key: "numbers.yesterday", area: "numbers", label: "Zahlen von gestern ansehen" },
  { key: "numbers.week", area: "numbers", label: "Wochenrückblick: Anmeldungen, Deals, Umsatz, Pro-Abos, 1 Sache besser machen", days: [FRI], href: "/admin/wachstum" },
  { key: "numbers.month", area: "numbers", label: "Monatszahlen sichern, Stripe-Auszahlungen und Gebühren abgleichen", monthDay: 1, href: "/admin/geld" },
];

const ROUTINE_KEYS = new Set(ROUTINES.map((r) => r.key));
export const isRoutineKey = (key: string) => ROUTINE_KEYS.has(key);

const WEEKDAY: Record<string, Weekday> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// The calendar day in Berlin: the key the ticks are stored under, the weekday and the day of the month.
export function berlinDay(now: Date): { day: string; weekday: Weekday; monthDay: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, weekday: WEEKDAY[parts.weekday], monthDay: Number(parts.day) };
}

export function routinesFor(now: Date): Routine[] {
  const { weekday, monthDay } = berlinDay(now);
  return ROUTINES.filter((r) => (r.days ? r.days.includes(weekday) : true) && (r.monthDay ? r.monthDay === monthDay : true));
}

// The day before `day` ("YYYY-MM-DD"), by the calendar, not by 24 hours.
export function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Days in a row, ending yesterday or today, on which everything due was ticked off. `complete` holds those days.
// Today only counts once it is complete; while it isn't, the streak still stands from yesterday.
export function streak(complete: Set<string>, today: string): number {
  let day = complete.has(today) ? today : previousDay(today);
  let count = 0;
  while (complete.has(day)) {
    count++;
    day = previousDay(day);
  }
  return count;
}

// Whether every routine due on `day` is in `done`. The routines due are worked out from noon that day in Berlin.
export function dayComplete(day: string, done: Set<string>): boolean {
  const due = routinesFor(new Date(`${day}T12:00:00+02:00`));
  return due.length > 0 && due.every((r) => done.has(r.key));
}
