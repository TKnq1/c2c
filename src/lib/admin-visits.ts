import { prisma } from "@/lib/prisma";
import { dailySeries, windowStart } from "@/lib/admin-stats";

const DAYS = 30;
const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);

export type VisitRow = { key: string; views: number; share: number | null; signups: number; rate: number | null };

// Visits to the landing page by where they came from, next to the sign-ups whose link carried the same source or campaign.
// Where a visit had no campaign link (a search, a friend) the sign-up carries nothing to match, so the rate stays empty.
export function visitRows(views: { key: string; views: number }[], signups: Map<string, number>): VisitRow[] {
  const total = views.reduce((sum, v) => sum + v.views, 0);
  return [...views]
    .sort((a, b) => b.views - a.views)
    .map((v) => {
      const matched = signups.get(v.key) ?? 0;
      return { key: v.key, views: v.views, share: ratio(v.views, total), signups: matched, rate: matched > 0 ? ratio(matched, v.views) : null };
    });
}

export async function loadVisits(now = new Date()) {
  const since = windowStart(DAYS, now);
  const [rows, users] = await Promise.all([
    prisma.pageView.findMany({ where: { day: { gte: since } } }),
    prisma.user.findMany({
      where: { role: { in: ["STARTUP", "CREATOR"] }, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true, utmSource: true, utmCampaign: true },
    }),
  ]);
  // Sign-ups from before the first counted visit have no visits to be measured against, so they are left out of the rates.
  const countingSince = rows.reduce<Date | null>((first, r) => (first === null || r.day < first ? r.day : first), null);
  const signupsInCount = countingSince ? users.filter((u) => u.createdAt >= countingSince) : [];
  const landing = rows.filter((r) => r.page === "landing");
  const group = (field: "source" | "campaign") => {
    const map = new Map<string, number>();
    for (const r of landing) {
      const key = r[field];
      if (field === "campaign" && key === "") continue;
      map.set(key, (map.get(key) ?? 0) + r.views);
    }
    return [...map].map(([key, count]) => ({ key, views: count }));
  };
  const count = (field: "utmSource" | "utmCampaign") => {
    const map = new Map<string, number>();
    for (const u of signupsInCount) {
      const key = u[field];
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };
  const landingViews = landing.reduce((sum, r) => sum + r.views, 0);
  const onboardingViews = rows.filter((r) => r.page === "onboarding").reduce((sum, r) => sum + r.views, 0);
  return {
    days: DAYS,
    hasData: rows.length > 0,
    landingViews,
    onboardingViews,
    countingSince,
    signups: signupsInCount.length,
    perHundred: landingViews > 0 ? (signupsInCount.length / landingViews) * 100 : null,
    bySource: visitRows(group("source"), count("utmSource")),
    byCampaign: visitRows(group("campaign"), count("utmCampaign")),
    byDay: dailySeries(landing, DAYS, (r) => r.day, (r) => r.views, now),
  };
}
