const TIME_ZONE = "Europe/Berlin";

// The hour on the clock in Berlin, 0 to 23. Read from the parts: "de-DE" formats a bare hour as "12 Uhr", which is not a number.
export function berlinHour(now: Date): number {
  const part = new Intl.DateTimeFormat("de-DE", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).formatToParts(now).find((p) => p.type === "hour");
  return Number(part?.value ?? 12);
}

export const greetingFor = (hour: number) => (hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend");

// The line under the greeting on "Heute": what came in over the last day and how much waits for the admin. The parts come
// back separate so the page can set the numbers in bold.
export function daySummary({ newUsers, payments, waiting }: { newUsers: number; payments: number; waiting: number }) {
  return {
    signups: newUsers === 0 ? "keine neue Anmeldung" : `${newUsers.toLocaleString("de-DE")} ${newUsers === 1 ? "neue Anmeldung" : "neue Anmeldungen"}`,
    payments: payments === 0 ? "keine Zahlung" : `${payments.toLocaleString("de-DE")} ${payments === 1 ? "Zahlung" : "Zahlungen"}`,
    waiting: waiting === 0 ? { count: "Nichts", rest: "wartet auf dich" } : waiting === 1 ? { count: "1 Ding", rest: "wartet auf dich" } : { count: `${waiting} Dinge`, rest: "warten auf dich" },
  };
}

const dayKey = (date: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE }).format(date);
const dayNumber = (key: string) => Date.parse(`${key}T00:00:00Z`) / 86_400_000;

// How long ago, as short as the inbox column on "Heute" needs: "vor 12 Min", "vor 2 Std", "gestern", "Mo", "3. Okt.".
export function shortAgo(at: Date, now = new Date()): string {
  const diff = now.getTime() - at.getTime();
  if (diff < 60_000) return "gerade eben";
  if (diff < 3_600_000) return `vor ${Math.floor(diff / 60_000)} Min`;
  const days = dayNumber(dayKey(now)) - dayNumber(dayKey(at));
  if (days <= 0) return `vor ${Math.floor(diff / 3_600_000)} Std`;
  if (days === 1) return "gestern";
  if (days < 7) return new Intl.DateTimeFormat("de-DE", { weekday: "short", timeZone: TIME_ZONE }).format(at).replace(".", "");
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: TIME_ZONE }).format(at);
}
