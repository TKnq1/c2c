import { prisma } from "@/lib/prisma";
import { computeResponseTimeMs } from "@/lib/response-time";
import { funnelSteps } from "@/lib/admin-dashboard";
import { pct } from "@/lib/admin-growth";
import { windowStart } from "@/lib/admin-stats";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEKS = 8;
const UNANSWERED_AFTER_DAYS = 3;

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Seven-day windows, oldest first; the last one ends at `now`. Labelled with the day the window starts.
export function weekBuckets(now: Date, count = WEEKS) {
  return Array.from({ length: count }, (_, i) => {
    const to = new Date(now.getTime() - (count - 1 - i) * 7 * DAY);
    const from = new Date(to.getTime() - 7 * DAY);
    const label = from.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" });
    return { from, to, label };
  });
}

export function durationLabel(ms: number | null): string {
  if (ms === null) return "–";
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / 60_000))} Min.`;
  if (ms < 48 * HOUR) return `${(ms / HOUR).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std.`;
  return `${(ms / DAY).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Tage`;
}

export type Market = Awaited<ReturnType<typeof loadMarket>>;

export async function loadMarket(now = new Date()) {
  const buckets = weekBuckets(now);
  const since90 = windowStart(90, now);
  const unansweredBefore = new Date(now.getTime() - UNANSWERED_AFTER_DAYS * DAY);
  const openRequest = { status: "OPEN" as const, closedByAdmin: false };
  const collab = { createdAt: { gte: since90 } };
  const both = [{ messages: { some: { senderRole: "STARTUP" as const } } }, { messages: { some: { senderRole: "CREATOR" as const } } }];

  const [weekRequests, weekInterests, firstInterests, conversations, started, bothWrote, offered, paid, released, refunded, disputed, openByNiche, creatorNiches, unanswered, openTotal, unansweredTotal] =
    await Promise.all([
      prisma.request.findMany({
        where: { createdAt: { gte: buckets[0].from }, status: { not: "DRAFT" } },
        select: { createdAt: true, interests: { select: { id: true }, take: 1 } },
      }),
      prisma.interest.findMany({ where: { createdAt: { gte: buckets[0].from } }, select: { createdAt: true } }),
      prisma.request.findMany({
        where: { createdAt: { gte: since90 }, interests: { some: {} } },
        select: { createdAt: true, interests: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 } },
      }),
      prisma.interest.findMany({
        where: { messages: { some: { createdAt: { gte: since90 } } } },
        select: { messages: { select: { senderRole: true, createdAt: true }, orderBy: { createdAt: "asc" } } },
        take: 3000,
      }),
      prisma.interest.count({ where: collab }),
      prisma.interest.count({ where: { ...collab, AND: both } }),
      // Older collabs have an amount but no offer history, so either counts as an offer having been made.
      prisma.interest.count({ where: { ...collab, OR: [{ offerEvents: { some: {} } }, { amountCents: { not: null } }] } }),
      prisma.interest.count({ where: { ...collab, paidAt: { not: null } } }),
      prisma.interest.count({ where: { ...collab, paymentStatus: "RELEASED" } }),
      prisma.interest.count({ where: { ...collab, refundedAt: { not: null } } }),
      prisma.interest.count({ where: { ...collab, disputedAt: { not: null } } }),
      prisma.request.groupBy({ by: ["niche"], where: openRequest, _count: true }),
      prisma.creatorProfile.findMany({ where: { user: { deletedAt: null } }, select: { niches: true } }),
      prisma.request.findMany({
        where: { ...openRequest, createdAt: { lt: unansweredBefore }, interests: { none: {} } },
        select: { id: true, title: true, niche: true, createdAt: true, startup: { select: { companyName: true } } },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
      prisma.request.count({ where: openRequest }),
      prisma.request.count({ where: { ...openRequest, createdAt: { lt: unansweredBefore }, interests: { none: {} } } }),
    ]);

  const weeks = buckets.map((b) => {
    const inWeek = weekRequests.filter((r) => r.createdAt >= b.from && r.createdAt < b.to);
    const withInterest = inWeek.filter((r) => r.interests.length > 0).length;
    return {
      label: b.label,
      requests: inWeek.length,
      withInterest,
      rate: pct(withInterest, inWeek.length),
      interests: weekInterests.filter((i) => i.createdAt >= b.from && i.createdAt < b.to).length,
    };
  });

  const nicheCreators = new Map<string, number>();
  for (const profile of creatorNiches) for (const niche of new Set(profile.niches)) nicheCreators.set(niche, (nicheCreators.get(niche) ?? 0) + 1);
  const niches = openByNiche
    .map((n) => ({ niche: n.niche, requests: n._count, creators: nicheCreators.get(n.niche) ?? 0 }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8);

  const messages = conversations.map((c) => c.messages);

  return {
    weeks,
    timeToFirstInterest: median(firstInterests.map((r) => r.interests[0].createdAt.getTime() - r.createdAt.getTime())),
    responseBrands: computeResponseTimeMs(messages, "STARTUP"),
    responseCreators: computeResponseTimeMs(messages, "CREATOR"),
    funnel: funnelSteps([
      { label: "Gespräch gestartet", count: started },
      { label: "Beide haben geschrieben", count: bothWrote },
      { label: "Angebot gemacht", count: offered },
      { label: "Bezahlt", count: paid },
      { label: "Ausgezahlt", count: released },
    ]),
    refunded,
    disputed,
    started,
    niches,
    creatorsTotal: creatorNiches.length,
    openTotal,
    unansweredTotal,
    unansweredAfterDays: UNANSWERED_AFTER_DAYS,
    unanswered: unanswered.map((r) => ({
      id: r.id,
      title: r.title,
      niche: r.niche,
      brand: r.startup.companyName,
      ageDays: Math.floor((now.getTime() - r.createdAt.getTime()) / DAY),
    })),
  };
}
