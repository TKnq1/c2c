import { prisma } from "@/lib/prisma";
import { dailySeries, windowStart } from "@/lib/admin-stats";
import type { DailyPoint } from "@/components/admin/daily-bar-chart";

// Change against the period before, as a whole percent. Null when there was nothing before to compare with.
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// The running total behind a daily series: today's total minus what the window added, plus each day on top.
export function cumulative(points: DailyPoint[], endTotal: number): number[] {
  let running = endTotal - points.reduce((sum, p) => sum + p.value, 0);
  return points.map((p) => (running += p.value));
}

export type FunnelStep = { label: string; count: number; shareOfPrevious: number | null };

// Counts become steps, each with its share of the step before.
export function funnelSteps(steps: { label: string; count: number }[]): FunnelStep[] {
  return steps.map((step, i) => ({
    ...step,
    shareOfPrevious: i === 0 ? null : steps[i - 1].count > 0 ? Math.round((step.count / steps[i - 1].count) * 100) : null,
  }));
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

// Everything the "Heute" page shows, from the live data. The ad figures arrive with the marketing packages.
export async function loadDashboard(now = new Date()) {
  const since = windowStart(30, now);
  const sincePrev = windowStart(60, now);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const people = { role: { in: ["STARTUP", "CREATOR"] as ("STARTUP" | "CREATOR")[] }, deletedAt: null };
  const cohort = { ...people, createdAt: { gte: since } };
  const paid = { paymentStatus: { in: ["HELD", "RELEASED"] as ("HELD" | "RELEASED")[] } };

  const [
    brands,
    creators,
    newLast30,
    newPrev30,
    signups,
    openRequests,
    closedRequests,
    collabs,
    volume,
    volumePrev,
    paidIn,
    feeReleased,
    feeHeld,
    feeMonth,
    payingBrands,
    payingCreators,
    foundingBrands,
    foundingCreators,
    requests30,
    requestsWithInterest30,
    funnelSignedUp,
    funnelOnboarded,
    funnelActive,
    funnelPaid,
  ] = await Promise.all([
    prisma.user.count({ where: { ...people, role: "STARTUP" } }),
    prisma.user.count({ where: { ...people, role: "CREATOR" } }),
    prisma.user.count({ where: cohort }),
    prisma.user.count({ where: { ...people, createdAt: { gte: sincePrev, lt: since } } }),
    prisma.user.findMany({ where: cohort, select: { createdAt: true } }),
    prisma.request.count({ where: { status: "OPEN" } }),
    prisma.request.count({ where: { status: "CLOSED" } }),
    prisma.interest.count(),
    prisma.interest.aggregate({ where: { ...paid, paidAt: { gte: since } }, _sum: { amountCents: true }, _count: true }),
    prisma.interest.aggregate({ where: { ...paid, paidAt: { gte: sincePrev, lt: since } }, _sum: { amountCents: true } }),
    prisma.interest.findMany({ where: { ...paid, paidAt: { gte: since } }, select: { paidAt: true, amountCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: "RELEASED" }, _sum: { platformFeeCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: "HELD" }, _sum: { platformFeeCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: "RELEASED", releasedAt: { gte: monthStart } }, _sum: { platformFeeCents: true } }),
    prisma.startupProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
    prisma.creatorProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
    prisma.startupProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.creatorProfile.count({ where: { foundingNumber: { not: null } } }),
    prisma.request.count({ where: { createdAt: { gte: since }, status: { not: "DRAFT" } } }),
    prisma.request.count({ where: { createdAt: { gte: since }, status: { not: "DRAFT" }, interests: { some: {} } } }),
    prisma.user.count({ where: cohort }),
    prisma.user.count({
      where: {
        ...cohort,
        OR: [
          { startupProfile: { is: { companyName: { not: "" }, niche: { not: "" } } } },
          { creatorProfile: { is: { displayName: { not: "" }, niches: { isEmpty: false } } } },
        ],
      },
    }),
    prisma.user.count({
      where: {
        ...cohort,
        OR: [{ startupProfile: { is: { requests: { some: {} } } } }, { creatorProfile: { is: { interests: { some: {} } } } }],
      },
    }),
    prisma.user.count({
      where: {
        ...cohort,
        OR: [
          { startupProfile: { is: { requests: { some: { interests: { some: paid } } } } } },
          { creatorProfile: { is: { interests: { some: paid } } } },
        ],
      },
    }),
  ]);

  const totalUsers = brands + creators;
  const signupSeries = dailySeries(signups, 30, (u) => u.createdAt);
  const volumeSeries = dailySeries(paidIn, 30, (p) => p.paidAt, (p) => p.amountCents ?? 0);
  const volumeCents = volume._sum.amountCents ?? 0;
  const requestsAll = openRequests + closedRequests;

  return {
    generatedAt: now.getTime(),
    users: {
      total: totalUsers,
      brands,
      creators,
      newLast30,
      change: percentChange(newLast30, newPrev30),
      trend: cumulative(signupSeries, totalUsers),
    },
    requests: { open: openRequests, closed: closedRequests, all: requestsAll, collabs },
    volume: {
      cents: volumeCents,
      count: volume._count,
      change: percentChange(volumeCents, volumePrev._sum.amountCents ?? 0),
      trend: volumeSeries.map((p) => p.value),
    },
    fee: {
      releasedCents: feeReleased._sum.platformFeeCents ?? 0,
      heldCents: feeHeld._sum.platformFeeCents ?? 0,
      monthCents: feeMonth._sum.platformFeeCents ?? 0,
    },
    pro: { paying: payingBrands + payingCreators, founding: foundingBrands + foundingCreators },
    founding: { brands: foundingBrands, creators: foundingCreators },
    market: {
      liquidity: requests30 > 0 ? Math.round((requestsWithInterest30 / requests30) * 100) : null,
      requests30,
      creatorsPerBrand: brands > 0 ? Math.round((creators / brands) * 10) / 10 : null,
    },
    signupSeries,
    funnel: funnelSteps([
      { label: "Angemeldet", count: funnelSignedUp },
      { label: "Onboarding fertig", count: funnelOnboarded },
      { label: "Erste Anfrage oder erstes Interesse", count: funnelActive },
      { label: "Bezahlte Collab", count: funnelPaid },
    ]),
  };
}


// The few numbers the morning screen shows, plus how far the founding-brand goal still is.
export async function loadMorningStats(goalBrands: number, now = new Date()) {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [newUsers, fee, foundingBrands] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["STARTUP", "CREATOR"] }, deletedAt: null, createdAt: { gte: dayAgo } } }),
    prisma.interest.aggregate({ where: { paymentStatus: "RELEASED", releasedAt: { gte: monthStart } }, _sum: { platformFeeCents: true } }),
    prisma.startupProfile.count({ where: { foundingNumber: { not: null } } }),
  ]);
  return { newUsers, feeCents: fee._sum.platformFeeCents ?? 0, brandsLeft: Math.max(0, goalBrands - foundingBrands) };
}
