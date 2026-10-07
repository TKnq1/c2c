import { prisma } from "@/lib/prisma";
import { dailySeries, windowStart } from "@/lib/admin-stats";
import { funnelSteps, percentChange } from "@/lib/admin-dashboard";

const DAY = 24 * 60 * 60 * 1000;
type Side = "STARTUP" | "CREATOR";

export const pct = (part: number, total: number): number | null => (total > 0 ? Math.round((part / total) * 100) : null);

export const HEARD_LABEL: Record<string, string> = {
  search: "Suchmaschine",
  social: "Social Media",
  friend: "Freunde und Bekannte",
  community: "Community",
  newsletter: "Newsletter",
  event: "Veranstaltung",
  other: "Sonstiges",
};

// Everyone who did something real in the window: signed in, or posted a request, showed interest or sent a message.
// Built from tables that already exist, so nothing new is tracked.
export async function activeUserIds(since: Date): Promise<Set<string>> {
  const [logins, requests, interests, messages] = await Promise.all([
    prisma.loginAttempt.findMany({ where: { succeeded: true, userId: { not: null }, createdAt: { gte: since } }, select: { userId: true }, distinct: ["userId"] }),
    prisma.request.findMany({ where: { createdAt: { gte: since } }, select: { startup: { select: { userId: true } } } }),
    prisma.interest.findMany({ where: { createdAt: { gte: since } }, select: { creator: { select: { userId: true } } } }),
    prisma.message.findMany({
      where: { createdAt: { gte: since } },
      select: { senderRole: true, interest: { select: { creator: { select: { userId: true } }, request: { select: { startup: { select: { userId: true } } } } } } },
    }),
  ]);
  const ids = new Set<string>();
  for (const l of logins) if (l.userId) ids.add(l.userId);
  for (const r of requests) ids.add(r.startup.userId);
  for (const i of interests) ids.add(i.creator.userId);
  for (const m of messages) ids.add(m.senderRole === "CREATOR" ? m.interest.creator.userId : m.interest.request.startup.userId);
  return ids;
}

async function funnelFor(side: Side, since: Date) {
  const cohort = { role: side, deletedAt: null, createdAt: { gte: since } };
  const paid = { paymentStatus: { in: ["HELD", "RELEASED"] as ("HELD" | "RELEASED")[] } };
  const onboarded =
    side === "STARTUP"
      ? { startupProfile: { is: { companyName: { not: "" }, niche: { not: "" } } } }
      : { creatorProfile: { is: { displayName: { not: "" }, niches: { isEmpty: false } } } };
  const acted = side === "STARTUP" ? { startupProfile: { is: { requests: { some: {} } } } } : { creatorProfile: { is: { interests: { some: {} } } } };
  const paidCollab =
    side === "STARTUP"
      ? { startupProfile: { is: { requests: { some: { interests: { some: paid } } } } } }
      : { creatorProfile: { is: { interests: { some: paid } } } };
  const [signedUp, done, active, paidUsers] = await Promise.all([
    prisma.user.count({ where: cohort }),
    prisma.user.count({ where: { ...cohort, ...onboarded } }),
    prisma.user.count({ where: { ...cohort, ...acted } }),
    prisma.user.count({ where: { ...cohort, ...paidCollab } }),
  ]);
  return funnelSteps([
    { label: "Angemeldet", count: signedUp },
    { label: "Onboarding fertig", count: done },
    { label: side === "STARTUP" ? "Erste Anfrage" : "Erstes Interesse", count: active },
    { label: "Bezahlte Collab", count: paidUsers },
  ]);
}

export type Growth = Awaited<ReturnType<typeof loadGrowth>>;

export async function loadGrowth(now = new Date()) {
  const since30 = windowStart(30, now);
  const since90 = windowStart(90, now);
  const since7 = new Date(now.getTime() - 7 * DAY);
  const people = { role: { in: ["STARTUP", "CREATOR"] as Side[] }, deletedAt: null };

  const [signups, funnelBrands, funnelCreators, active7, active30, retentionCohort, activationCohort, proEvents, payingBrands, payingCreators, heard, weekRows] = await Promise.all([
    prisma.user.findMany({ where: { ...people, createdAt: { gte: since30 } }, select: { createdAt: true, role: true } }),
    funnelFor("STARTUP", since90),
    funnelFor("CREATOR", since90),
    activeUserIds(since7),
    activeUserIds(new Date(now.getTime() - 30 * DAY)),
    // Signed up 7 to 37 days ago: did they come back in the last week?
    prisma.user.findMany({ where: { ...people, createdAt: { gte: new Date(now.getTime() - 37 * DAY), lt: since7 } }, select: { id: true } }),
    // Signed up 60 to 7 days ago: did they do something within their first week?
    prisma.user.findMany({
      where: { ...people, createdAt: { gte: new Date(now.getTime() - 60 * DAY), lt: since7 } },
      select: {
        createdAt: true,
        startupProfile: { select: { requests: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 } } },
        creatorProfile: { select: { interests: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 } } },
      },
    }),
    prisma.proEvent.findMany({ where: { at: { gte: since90 } }, select: { kind: true, at: true } }),
    prisma.startupProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
    prisma.creatorProfile.count({ where: { isPro: true, stripeSubscriptionId: { not: null } } }),
    prisma.user.groupBy({ by: ["heardFrom"], where: { ...people, createdAt: { gte: since90 } }, _count: true }),
    Promise.all([
      ...[0, 1].map((w) => {
        const to = new Date(now.getTime() - w * 7 * DAY);
        const from = new Date(to.getTime() - 7 * DAY);
        const range = { gte: from, lt: to };
        return Promise.all([
          prisma.user.count({ where: { ...people, role: "STARTUP", createdAt: range } }),
          prisma.user.count({ where: { ...people, role: "CREATOR", createdAt: range } }),
          prisma.request.count({ where: { createdAt: range } }),
          prisma.interest.count({ where: { createdAt: range } }),
          prisma.interest.count({ where: { paidAt: range, paymentStatus: { in: ["HELD", "RELEASED"] } } }),
          prisma.interest.aggregate({ where: { paidAt: range, paymentStatus: { in: ["HELD", "RELEASED"] } }, _sum: { amountCents: true } }),
        ]);
      }),
    ]),
  ]);

  const returned = retentionCohort.filter((u) => active7.has(u.id)).length;
  const activated = activationCohort.filter((u) => {
    const first = u.startupProfile?.requests[0]?.createdAt ?? u.creatorProfile?.interests[0]?.createdAt;
    return !!first && first.getTime() - u.createdAt.getTime() <= 7 * DAY;
  }).length;

  const [thisWeek, lastWeek] = weekRows;
  const weekLine = (label: string, i: number, money = false) => {
    const current = money ? (thisWeek[i] as { _sum: { amountCents: number | null } })._sum.amountCents ?? 0 : (thisWeek[i] as number);
    const previous = money ? (lastWeek[i] as { _sum: { amountCents: number | null } })._sum.amountCents ?? 0 : (lastWeek[i] as number);
    return { label, current, previous, change: percentChange(current, previous), money };
  };

  return {
    signupsBrands: dailySeries(signups.filter((s) => s.role === "STARTUP"), 30, (u) => u.createdAt),
    signupsCreators: dailySeries(signups.filter((s) => s.role === "CREATOR"), 30, (u) => u.createdAt),
    funnelBrands,
    funnelCreators,
    active7: active7.size,
    active30: active30.size,
    activation: { rate: pct(activated, activationCohort.length), cohort: activationCohort.length },
    retention: { rate: pct(returned, retentionCohort.length), cohort: retentionCohort.length },
    pro: {
      paying: payingBrands + payingCreators,
      started30: proEvents.filter((e) => e.kind === "STARTED" && e.at >= since30).length,
      ended30: proEvents.filter((e) => e.kind === "ENDED" && e.at >= since30).length,
      started90: proEvents.filter((e) => e.kind === "STARTED").length,
      ended90: proEvents.filter((e) => e.kind === "ENDED").length,
    },
    heard: [...heard]
      .map((h) => ({ code: h.heardFrom, label: h.heardFrom ? (HEARD_LABEL[h.heardFrom] ?? h.heardFrom) : "Keine Angabe", count: h._count }))
      .sort((a, b) => b.count - a.count),
    week: [
      weekLine("Neue Marken", 0),
      weekLine("Neue Creator", 1),
      weekLine("Neue Anfragen", 2),
      weekLine("Neues Interesse", 3),
      weekLine("Bezahlte Collabs", 4),
      weekLine("Zahlungsvolumen", 5, true),
    ],
  };
}
