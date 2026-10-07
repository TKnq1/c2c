import type { FixedCost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { windowStart } from "@/lib/admin-stats";
import { PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";

// What the fixed costs come to in a month: yearly ones are spread over twelve; switched-off ones do not count.
export function monthlyCents(costs: Pick<FixedCost, "amountCents" | "interval" | "active">[]): number {
  return costs.reduce((sum, c) => (c.active ? sum + (c.interval === "YEARLY" ? Math.round(c.amountCents / 12) : c.amountCents) : sum), 0);
}

export type Runway = { kind: "unknown" } | { kind: "profitable" } | { kind: "empty" } | { kind: "months"; months: number };

// How long the balance lasts at the current net burn (costs minus income per month). No balance entered: unknown.
// Income at or above the costs: the business pays for itself, there is no runway to count.
export function runway(balanceCents: number | null, netBurnCents: number): Runway {
  if (balanceCents === null) return { kind: "unknown" };
  if (netBurnCents <= 0) return { kind: "profitable" };
  if (balanceCents <= 0) return { kind: "empty" };
  return { kind: "months", months: Math.round((balanceCents / netBurnCents) * 10) / 10 };
}

export function runwayText(r: Runway): { big: string; small: string } {
  if (r.kind === "months" && r.months > 60) return { big: "Über 5 Jahre", small: "bei den Kosten und Einnahmen der letzten 30 Tage" };
  if (r.kind === "months") return { big: `${r.months.toLocaleString("de-DE")} Monate`, small: "bei den Kosten und Einnahmen der letzten 30 Tage" };
  if (r.kind === "profitable") return { big: "Trägt sich", small: "Die Einnahmen der letzten 30 Tage decken die Kosten. Es gibt keinen Verbrauch, den man hochrechnen müsste." };
  if (r.kind === "empty") return { big: "Aufgebraucht", small: "Der eingetragene Kontostand ist null oder negativ." };
  return { big: "Kontostand fehlt", small: "Trag auf der Geld-Seite deinen Kontostand ein, dann rechnet das Dashboard die Reichweite aus." };
}

export type MonthSlot = { key: string; start: Date; end: Date; label: string };

// The last `count` calendar months, oldest first, in UTC.
export function lastMonths(now: Date, count: number): MonthSlot[] {
  return Array.from({ length: count }, (_, i) => {
    const offset = count - 1 - i;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset + 1, 1));
    return { key: start.toISOString().slice(0, 7), start, end, label: start.toLocaleDateString("de-DE", { month: "short", timeZone: "UTC" }).replace(".", "") };
  });
}

export type Money = Awaited<ReturnType<typeof loadMoney>>;

export async function loadMoney(now = new Date()) {
  const since30 = windowStart(30, now);
  const months = lastMonths(now, 6);
  const monthStart = months[months.length - 1].start;
  const [costs, settings, snapshots, releasedRows, ads30, adsMonth, escrow, paidOut, refunded, volume, countAll, countRefunded, payingBrands, payingCreators] = await Promise.all([
    prisma.fixedCost.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] }),
    prisma.adminSettings.findUnique({ where: { id: 1 } }),
    prisma.cashSnapshot.findMany({ orderBy: { at: "asc" }, take: 36 }),
    prisma.interest.findMany({ where: { paymentStatus: "RELEASED", releasedAt: { gte: months[0].start } }, select: { releasedAt: true, platformFeeCents: true } }),
    prisma.adSpend.aggregate({ where: { day: { gte: since30 } }, _sum: { spendCents: true } }),
    prisma.adSpend.aggregate({ where: { day: { gte: monthStart } }, _sum: { spendCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: "HELD" }, _sum: { amountCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: "RELEASED" }, _sum: { amountCents: true, platformFeeCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: "REFUNDED" }, _sum: { amountCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: { in: ["HELD", "RELEASED"] } }, _sum: { amountCents: true, platformFeeCents: true } }),
    prisma.interest.count({ where: { paymentStatus: { in: ["HELD", "RELEASED", "REFUNDED"] } } }),
    prisma.interest.count({ where: { paymentStatus: "REFUNDED" } }),
    prisma.startupProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
    prisma.creatorProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
  ]);

  const feeByMonth = months.map((m) => ({
    label: m.label,
    value: releasedRows.filter((r) => r.releasedAt && r.releasedAt >= m.start && r.releasedAt < m.end).reduce((sum, r) => sum + (r.platformFeeCents ?? 0), 0),
  }));
  const feeMonth = feeByMonth[feeByMonth.length - 1].value;
  const feeLast30 = releasedRows.filter((r) => r.releasedAt && r.releasedAt >= since30).reduce((sum, r) => sum + (r.platformFeeCents ?? 0), 0);
  const proMrr = (payingBrands + payingCreators) * PRO_SUBSCRIPTION_PRICE_CENTS;
  const fixedMonthly = monthlyCents(costs);
  const adsLast30 = ads30._sum.spendCents ?? 0;
  const adsThisMonth = adsMonth._sum.spendCents ?? 0;
  const income30 = feeLast30 + proMrr;
  const netBurn = fixedMonthly + adsLast30 - income30;
  const volumeCents = volume._sum.amountCents ?? 0;
  const balanceCents = settings?.cashBalanceCents ?? null;

  return {
    costs,
    fixedMonthly,
    adsLast30,
    adsThisMonth,
    feeMonth,
    feeLast30,
    proMrr,
    paying: payingBrands + payingCreators,
    resultMonth: feeMonth + proMrr - fixedMonthly - adsThisMonth,
    income30,
    netBurn,
    balanceCents,
    balanceAt: settings?.cashBalanceAt ?? null,
    balanceHistory: snapshots.map((s) => ({ label: s.at.toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "UTC" }), value: s.balanceCents })),
    runway: runway(balanceCents, netBurn),
    feeByMonth,
    platform: {
      escrowCents: escrow._sum.amountCents ?? 0,
      paidOutCents: (paidOut._sum.amountCents ?? 0) - (paidOut._sum.platformFeeCents ?? 0),
      refundedCents: refunded._sum.amountCents ?? 0,
      volumeCents,
      takeRatePct: volumeCents > 0 ? Math.round(((volume._sum.platformFeeCents ?? 0) / volumeCents) * 1000) / 10 : null,
      refundRatePct: countAll > 0 ? Math.round((countRefunded / countAll) * 1000) / 10 : null,
    },
  };
}
