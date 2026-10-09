import { prisma } from "@/lib/prisma";
import { activityEvents } from "@/lib/admin-growth";
import { dailySeries } from "@/lib/admin-stats";
import { daysBefore, distinctBetween } from "@/lib/admin-trends";

export type Anomaly = { key: string; tone: "down" | "up"; text: string };

const BASELINE_DAYS = 14;
const mean = (values: number[]) => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);
const one = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });

// A day that falls far outside the usual: against the average of the 14 days before it. Small numbers are left alone
// (an average under two a day says nothing), so a quiet product does not cry wolf. `daily` is oldest first and ends
// with the day to judge (yesterday: today is not over).
function dayAnomaly(key: string, noun: { one: string; many: string }, daily: number[]): Anomaly | null {
  if (daily.length < BASELINE_DAYS + 1) return null;
  const value = daily[daily.length - 1];
  const usual = mean(daily.slice(daily.length - 1 - BASELINE_DAYS, daily.length - 1));
  if (usual >= 2 && value <= usual * 0.3) {
    return { key, tone: "down", text: `Gestern ${value === 0 ? "keine" : value} ${value === 1 ? noun.one : noun.many}, sonst im Schnitt ${one(usual)} am Tag` };
  }
  if (value >= 5 && value >= usual * 3) {
    return { key, tone: "up", text: `Gestern ${value} ${noun.many}, sonst im Schnitt ${one(usual)} am Tag` };
  }
  return null;
}

// This week's active people against last week's, when there were enough of them to compare.
function activeAnomaly(current: number, before: number): Anomaly | null {
  if (before >= 5 && current <= before * 0.6) return { key: "active", tone: "down", text: `Aktive Nutzer in 7 Tagen: ${current} statt ${before} in der Woche davor` };
  if (current - before >= 5 && current >= before * 2) return { key: "active", tone: "up", text: `Aktive Nutzer in 7 Tagen: ${current} statt ${before} in der Woche davor` };
  return null;
}

export function findAnomalies(input: { signups: number[]; requests: number[]; active: { current: number; before: number } }): Anomaly[] {
  return [
    dayAnomaly("signups", { one: "Anmeldung", many: "Anmeldungen" }, input.signups),
    dayAnomaly("requests", { one: "neue Anfrage", many: "neue Anfragen" }, input.requests),
    activeAnomaly(input.active.current, input.active.before),
  ].filter((a): a is Anomaly => a !== null);
}

export async function loadAnomalies(now = new Date()): Promise<Anomaly[]> {
  const days = BASELINE_DAYS + 2;
  const since = daysBefore(now, days + 1);
  const people = { role: { in: ["STARTUP", "CREATOR"] as ("STARTUP" | "CREATOR")[] }, deletedAt: null };
  const [users, requests, events] = await Promise.all([
    prisma.user.findMany({ where: { ...people, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.request.findMany({ where: { createdAt: { gte: since }, status: { not: "DRAFT" } }, select: { createdAt: true } }),
    activityEvents(daysBefore(now, 14)),
  ]);
  // Drop today (it is not over), so the last entry is yesterday.
  const daily = (rows: { createdAt: Date }[]) =>
    dailySeries(rows, days, (r) => r.createdAt, () => 1, now)
      .slice(0, -1)
      .map((p) => p.value);
  return findAnomalies({
    signups: daily(users),
    requests: daily(requests),
    active: { current: distinctBetween(events, daysBefore(now, 7), now), before: distinctBetween(events, daysBefore(now, 14), new Date(daysBefore(now, 7).getTime() - 1)) },
  });
}
