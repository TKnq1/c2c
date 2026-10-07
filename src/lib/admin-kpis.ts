import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { dailySeries } from "@/lib/admin-stats";
import { activityEvents } from "@/lib/admin-growth";
import { loadMoney, runwayText } from "@/lib/admin-money";
import { forecastGoal, forecastText, PACE_DAYS } from "@/lib/admin-forecast";
import { lineDays, periodWords, type Period } from "@/lib/admin-period";
import type { AdminPrefs, KpiSet } from "@/lib/admin-prefs";
import { daysBefore, distinctBetween, rollingDistinct, rollingSum, runningTotal, sumBetween, waitingSeries, windowPair, type Amount, type TrendPoint } from "@/lib/admin-trends";

export const UNANSWERED_AFTER_DAYS = 3;
const people = { role: { in: ["STARTUP", "CREATOR"] as ("STARTUP" | "CREATOR")[] }, deletedAt: null };

// One headline figure on "Heute", ready to show: what it says, how far it moved, and the line behind it (with the same
// stretch of the period before, dashed, for comparison).
export type KpiTileModel = {
  key: string;
  label: string;
  value: string;
  delta?: { amount: number; text?: string; label: string; upIsGood?: boolean };
  series?: TrendPoint[];
  previous?: TrendPoint[];
  hint: string;
  href: string;
};

type Ctx = { now: Date; period: Period; prefs: AdminPrefs };

const sum = (points: TrendPoint[]) => points.reduce((total, p) => total + p.value, 0);
const lastValue = (points: TrendPoint[]) => points[points.length - 1]?.value ?? 0;
// The end of the period before the current one, just short of where the current one starts.
const endOfBefore = (now: Date, period: number) => new Date(daysBefore(now, period).getTime() - 1);
const percent = (rate: number) => `${(rate * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;

// A figure that flows in over time (sign-ups, commission): sum over a window, rolling for the line.
function flowTile(args: { key: string; label: string; rows: Amount[]; format: (n: number) => string; hint: (before: string) => string; href: string; ctx: Ctx; upIsGood?: boolean }): KpiTileModel {
  const { now, period } = args.ctx;
  const L = lineDays(period);
  const w = periodWords(period);
  const series = rollingSum(args.rows, L, period, now);
  const previous = rollingSum(args.rows, L, period, daysBefore(now, L));
  const value = lastValue(series);
  const before = sumBetween(args.rows, daysBefore(now, 2 * period), endOfBefore(now, period));
  const change = value - before;
  return {
    key: args.key,
    label: `${args.label}, ${w.short}`,
    value: args.format(value),
    delta: { amount: change, text: args.format(Math.abs(change)), label: w.before, upIsGood: args.upIsGood },
    series,
    previous,
    hint: args.hint(args.format(before)),
    href: args.href,
  };
}

const count = (n: number) => n.toLocaleString("de-DE");

async function usersTile({ now, period }: Ctx): Promise<KpiTileModel> {
  const L = lineDays(period);
  const w = periodWords(period);
  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where: { ...people, createdAt: { gte: daysBefore(now, 2 * L) } }, select: { createdAt: true } }),
    prisma.user.count({ where: people }),
  ]);
  const daily = dailySeries(rows, L, (r) => r.createdAt, () => 1, now);
  const dailyPrev = dailySeries(rows, L, (r) => r.createdAt, () => 1, daysBefore(now, L));
  const { current, before } = windowPair([...dailyPrev, ...daily], period);
  return {
    key: "users",
    label: "Nutzer",
    value: count(total),
    delta: { amount: current, label: w.within },
    series: runningTotal(daily, total),
    previous: runningTotal(dailyPrev, total - sum(daily)),
    hint: `${w.previousIs}: +${count(before)}`,
    href: "/admin/wachstum",
  };
}

async function activeTile({ now, period }: Ctx): Promise<KpiTileModel> {
  const L = lineDays(period);
  const w = periodWords(period);
  // Each day looks back `period` days, so the events reach back that much further than the line.
  const events = await activityEvents(daysBefore(now, 2 * L + period));
  const series = rollingDistinct(events, L, period, now);
  const value = lastValue(series);
  const before = distinctBetween(events, daysBefore(now, 2 * period), endOfBefore(now, period));
  return {
    key: "active",
    label: `Aktive Nutzer, ${w.short}`,
    value: count(value),
    delta: { amount: value - before, label: w.before },
    series,
    previous: rollingDistinct(events, L, period, daysBefore(now, L)),
    hint: "Mit mindestens einer Aktion",
    href: "/admin/wachstum",
  };
}

async function foundingTile({ now, period, prefs }: Ctx): Promise<KpiTileModel> {
  const L = lineDays(period);
  const w = periodWords(period);
  const since = daysBefore(now, 2 * L);
  const [brands, creators, brandRows, creatorRows] = await Promise.all([
    prisma.startupProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.creatorProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.startupProfile.findMany({ where: { foundingNumber: { not: null }, user: { createdAt: { gte: since } } }, select: { user: { select: { createdAt: true } } } }),
    prisma.creatorProfile.findMany({ where: { foundingNumber: { not: null }, user: { createdAt: { gte: since } } }, select: { user: { select: { createdAt: true } } } }),
  ]);
  const rows = [...brandRows, ...creatorRows];
  const total = brands + creators;
  const goal = prefs.goalBrands + prefs.goalCreators;
  const daily = dailySeries(rows, L, (r) => r.user.createdAt, () => 1, now);
  const dailyPrev = dailySeries(rows, L, (r) => r.user.createdAt, () => 1, daysBefore(now, L));
  const { current } = windowPair([...dailyPrev, ...daily], period);
  const gained = rows.filter((r) => r.user.createdAt >= daysBefore(now, PACE_DAYS)).length;
  return {
    key: "founding",
    label: "Founding-Plätze",
    value: `${total} von ${goal}`,
    delta: { amount: current, label: w.within },
    series: runningTotal(daily, total),
    previous: runningTotal(dailyPrev, total - sum(daily)),
    hint: `${brands} von ${prefs.goalBrands} Marken · ${creators} von ${prefs.goalCreators} Creator · ${forecastText(forecastGoal({ current: total, goal, gainedInPaceWindow: gained }, now))}`,
    href: "/admin/users",
  };
}

async function waitingTile({ now, period }: Ctx): Promise<KpiTileModel> {
  const L = lineDays(period);
  const w = periodWords(period);
  const open = await prisma.request.findMany({
    where: { status: "OPEN", closedByAdmin: false },
    select: { createdAt: true, interests: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const rows = open.map((r) => ({ createdAt: r.createdAt, firstInterestAt: r.interests[0]?.createdAt ?? null }));
  const series = waitingSeries(rows, L, UNANSWERED_AFTER_DAYS, now);
  const value = lastValue(series);
  const then = waitingSeries(rows, 1, UNANSWERED_AFTER_DAYS, daysBefore(now, period))[0].value;
  return {
    key: "waiting",
    label: "Anfragen ohne Interesse",
    value: count(value),
    delta: { amount: value - then, label: w.since, upIsGood: false },
    series,
    previous: waitingSeries(rows, L, UNANSWERED_AFTER_DAYS, daysBefore(now, L)),
    hint: `Offen und älter als ${UNANSWERED_AFTER_DAYS} Tage`,
    href: "/admin/marktplatz",
  };
}

async function feeTile(ctx: Ctx): Promise<KpiTileModel> {
  const { now, period } = ctx;
  const interests = await prisma.interest.findMany({
    where: { paymentStatus: "RELEASED", releasedAt: { gte: daysBefore(now, 2 * lineDays(period) + period) } },
    select: { releasedAt: true, platformFeeCents: true },
  });
  const rows = interests.flatMap((i) => (i.releasedAt ? [{ at: i.releasedAt, amount: i.platformFeeCents ?? 0 }] : []));
  return flowTile({ key: "fee", label: "Provision", rows, format: formatCents, hint: (b) => `${periodWords(period).previousIs}: ${b}`, href: "/admin/geld", ctx });
}

async function volumeTile(ctx: Ctx): Promise<KpiTileModel> {
  const { now, period } = ctx;
  const interests = await prisma.interest.findMany({
    where: { paymentStatus: { in: ["HELD", "RELEASED"] }, paidAt: { gte: daysBefore(now, 2 * lineDays(period) + period) } },
    select: { paidAt: true, amountCents: true },
  });
  const rows = interests.flatMap((i) => (i.paidAt ? [{ at: i.paidAt, amount: i.amountCents ?? 0 }] : []));
  return flowTile({ key: "volume", label: "Zahlungsvolumen", rows, format: formatCents, hint: (b) => `${periodWords(period).previousIs}: ${b}`, href: "/admin/payments", ctx });
}

async function proTile({ now, period }: Ctx): Promise<KpiTileModel> {
  const L = lineDays(period);
  const w = periodWords(period);
  const [brands, creators, events] = await Promise.all([
    prisma.startupProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
    prisma.creatorProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
    prisma.proEvent.findMany({ where: { at: { gte: daysBefore(now, 2 * L) } }, select: { kind: true, at: true } }),
  ]);
  const paying = brands + creators;
  const net = (e: { kind: string }) => (e.kind === "STARTED" ? 1 : -1);
  const daily = dailySeries(events, L, (e) => e.at, net, now);
  const dailyPrev = dailySeries(events, L, (e) => e.at, net, daysBefore(now, L));
  const { current, before } = windowPair([...dailyPrev, ...daily], period);
  return {
    key: "pro",
    label: "Pro-Abos",
    value: count(paying),
    delta: { amount: current, label: w.within },
    series: runningTotal(daily, paying),
    previous: runningTotal(dailyPrev, paying - sum(daily)),
    hint: `Zahlende Abos, netto neu. ${w.previousIs}: ${before > 0 ? "+" : ""}${before}`,
    href: "/admin/users?role=STARTUP&pro=1",
  };
}

async function runwayTile({ now }: Ctx): Promise<KpiTileModel> {
  const money = await loadMoney(now);
  const text = runwayText(money.runway);
  return {
    key: "runway",
    label: "Reichweite des Geldes",
    value: text.big,
    hint: money.balanceCents === null ? "Kontostand auf der Geld-Seite eintragen" : `Kontostand ${formatCents(money.balanceCents)}`,
    href: "/admin/geld",
  };
}

// What the ad spend and the sign-ups from campaigns with spend came to, in the last `period` days and the period before.
async function adWindows({ now, period }: Ctx) {
  const since = daysBefore(now, 2 * period);
  const [spend, signups] = await Promise.all([
    prisma.adSpend.findMany({ where: { day: { gte: since } }, select: { day: true, spendCents: true, clicks: true, campaignKey: true } }),
    prisma.user.findMany({ where: { ...people, createdAt: { gte: since }, utmCampaign: { not: null } }, select: { createdAt: true, utmCampaign: true } }),
  ]);
  const windowOf = (from: Date, to: Date) => {
    const inSpend = spend.filter((s) => s.day >= from && s.day <= to);
    const keys = new Set(inSpend.map((s) => s.campaignKey));
    return {
      spendCents: inSpend.reduce((t, s) => t + s.spendCents, 0),
      clicks: inSpend.reduce((t, s) => t + s.clicks, 0),
      signups: signups.filter((u) => u.createdAt >= from && u.createdAt <= to && u.utmCampaign && keys.has(u.utmCampaign)).length,
    };
  };
  return { current: windowOf(daysBefore(now, period), now), before: windowOf(since, endOfBefore(now, period)) };
}

async function adSpendTile(ctx: Ctx): Promise<KpiTileModel> {
  const { now, period } = ctx;
  const spend = await prisma.adSpend.findMany({ where: { day: { gte: daysBefore(now, 2 * lineDays(period) + period) } }, select: { day: true, spendCents: true } });
  return flowTile({ key: "adspend", label: "Ausgaben", rows: spend.map((s) => ({ at: s.day, amount: s.spendCents })), format: formatCents, hint: () => "Aus dem Import der Werbe-Manager", href: "/admin/ads", ctx });
}

async function cpaTile(ctx: Ctx): Promise<KpiTileModel> {
  const w = periodWords(ctx.period);
  const { current, before } = await adWindows(ctx);
  const cpa = current.signups > 0 && current.spendCents > 0 ? current.spendCents / current.signups : null;
  const cpaBefore = before.signups > 0 && before.spendCents > 0 ? before.spendCents / before.signups : null;
  return {
    key: "cpa",
    label: "Kosten je Anmeldung",
    value: cpa === null ? "–" : formatCents(Math.round(cpa)),
    delta: cpa !== null && cpaBefore !== null ? { amount: Math.round(cpa - cpaBefore), text: formatCents(Math.abs(Math.round(cpa - cpaBefore))), label: w.before, upIsGood: false } : undefined,
    hint: `${current.signups} Anmeldungen über Kampagnen mit Ausgaben`,
    href: "/admin/ads",
  };
}

async function clicksTile(ctx: Ctx): Promise<KpiTileModel> {
  const w = periodWords(ctx.period);
  const { current, before } = await adWindows(ctx);
  const rate = current.clicks > 0 ? current.signups / current.clicks : null;
  const rateBefore = before.clicks > 0 ? before.signups / before.clicks : null;
  return {
    key: "clicks",
    label: "Klick zur Anmeldung",
    value: rate === null ? "–" : percent(rate),
    delta:
      rate !== null && rateBefore !== null
        ? { amount: rate - rateBefore, text: `${(Math.abs(rate - rateBefore) * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Pkt.`, label: w.before }
        : undefined,
    hint: `${count(current.signups)} Anmeldungen auf ${count(current.clicks)} Klicks`,
    href: "/admin/ads",
  };
}

async function taggedTile(ctx: Ctx): Promise<KpiTileModel> {
  const { now, period } = ctx;
  const users = await prisma.user.findMany({
    where: { ...people, createdAt: { gte: daysBefore(now, 2 * lineDays(period) + period) } },
    select: { createdAt: true, utmSource: true, utmCampaign: true },
  });
  const rows = users.filter((u) => u.utmSource || u.utmCampaign).map((u) => ({ at: u.createdAt, amount: 1 }));
  const total = users.filter((u) => u.createdAt >= daysBefore(now, period)).length;
  return flowTile({ key: "tagged", label: "Anmeldungen mit Kampagne", rows, format: count, hint: () => `von ${count(total)} Anmeldungen im Zeitraum`, href: "/admin/ads", ctx });
}

const BUILDERS: Record<string, (ctx: Ctx) => Promise<KpiTileModel>> = {
  users: usersTile,
  active: activeTile,
  founding: foundingTile,
  waiting: waitingTile,
  fee: feeTile,
  volume: volumeTile,
  pro: proTile,
  runway: runwayTile,
  adspend: adSpendTile,
  cpa: cpaTile,
  clicks: clicksTile,
  tagged: taggedTile,
};

// Which four figures each choice in "Anpassen" puts at the top.
export const KPI_SET_TILES: Record<KpiSet, string[]> = {
  wachstum: ["users", "active", "founding", "waiting"],
  geld: ["fee", "volume", "pro", "runway"],
  marketing: ["adspend", "cpa", "clicks", "tagged"],
  gemischt: ["users", "fee", "waiting", "cpa"],
};

export async function loadKpis(ctx: Ctx): Promise<KpiTileModel[]> {
  return Promise.all(KPI_SET_TILES[ctx.prefs.kpiSet].map((key) => BUILDERS[key](ctx)));
}

