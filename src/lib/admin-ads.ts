import { prisma } from "@/lib/prisma";
import { dailySeries, windowStart } from "@/lib/admin-stats";
import { funnelSteps } from "@/lib/admin-dashboard";

export type SpendRow = {
  day: Date;
  channel: string;
  campaignKey: string;
  campaignName: string;
  spendCents: number;
  impressions: number;
  clicks: number;
};
export type SignupRow = {
  source: string | null;
  campaign: string | null;
  role: "STARTUP" | "CREATOR";
  activated: boolean;
  interests: { id: string; paid: boolean; feeCents: number }[];
};

const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);

// The channel a sign-up's utm_source belongs to, in the names the spend import uses.
export function sourceChannel(source: string | null): string {
  if (!source) return "none";
  if (["facebook", "fb", "meta", "ig", "instagram"].includes(source)) return source === "instagram" || source === "ig" ? "instagram" : "meta";
  if (["tiktok", "tt"].includes(source)) return "tiktok";
  if (["google", "youtube", "adwords"].includes(source)) return "google";
  return source;
}

type Totals = {
  spendCents: number;
  impressions: number;
  clicks: number;
  signups: number;
  brands: number;
  creators: number;
  activated: number;
  payers: number;
  paidCollabs: number;
  feeCents: number;
};

// The collabs (and the commission on them) behind a group of sign-ups, each counted once even when both sides came from it.
function outcomes(signups: SignupRow[]) {
  const seen = new Map<string, { paid: boolean; feeCents: number }>();
  for (const s of signups) for (const i of s.interests) seen.set(i.id, { paid: i.paid, feeCents: i.feeCents });
  let paidCollabs = 0;
  let feeCents = 0;
  for (const i of seen.values()) {
    if (i.paid) paidCollabs++;
    feeCents += i.feeCents;
  }
  return { paidCollabs, feeCents };
}

function totals(spend: SpendRow[], signups: SignupRow[]): Totals {
  return {
    spendCents: spend.reduce((s, r) => s + r.spendCents, 0),
    impressions: spend.reduce((s, r) => s + r.impressions, 0),
    clicks: spend.reduce((s, r) => s + r.clicks, 0),
    signups: signups.length,
    brands: signups.filter((s) => s.role === "STARTUP").length,
    creators: signups.filter((s) => s.role === "CREATOR").length,
    activated: signups.filter((s) => s.activated).length,
    payers: signups.filter((s) => s.interests.some((i) => i.paid)).length,
    ...outcomes(signups),
  };
}

// The rates a marketer asks for. Null where the denominator is zero, so the page shows a dash instead of a made-up figure.
export function rates(t: Totals) {
  return {
    ctr: ratio(t.clicks, t.impressions),
    cpcCents: ratio(t.spendCents, t.clicks),
    clickToSignup: ratio(t.signups, t.clicks),
    cpaCents: ratio(t.spendCents, t.signups),
    costPerActivatedCents: ratio(t.spendCents, t.activated),
  };
}

export type CampaignRow = Totals & ReturnType<typeof rates> & { key: string; name: string; channels: string[] };

// One row per campaign, matched by name: money from the imported spend, people from the sign-ups that carry the same
// utm_campaign. Campaigns with sign-ups but no spend (an organic post, a creator's link) and spend without sign-ups both show.
export function aggregateCampaigns(spend: SpendRow[], signups: SignupRow[]): CampaignRow[] {
  const keys = new Set<string>([...spend.map((s) => s.campaignKey), ...signups.flatMap((s) => (s.campaign ? [s.campaign] : []))]);
  return [...keys]
    .map((key) => {
      const mine = spend.filter((s) => s.campaignKey === key);
      const people = signups.filter((s) => s.campaign === key);
      const t = totals(mine, people);
      const latest = [...mine].sort((a, b) => b.day.getTime() - a.day.getTime())[0];
      return { key, name: latest?.campaignName ?? key, channels: [...new Set(mine.map((s) => s.channel))], ...t, ...rates(t) };
    })
    .sort((a, b) => b.spendCents - a.spendCents || b.signups - a.signups);
}

export type ChannelRow = Totals & ReturnType<typeof rates> & { channel: string };

// One row per channel: the imported spend of that channel and the sign-ups behind it. A sign-up from a campaign that has
// spend counts for that campaign's channel (an Instagram placement bought in the Meta ad manager is Meta); the others
// count for the channel their utm_source maps to, and those without a source ("none") are everything that came on its own.
export function aggregateChannels(spend: SpendRow[], signups: SignupRow[]): ChannelRow[] {
  const campaignChannel = new Map<string, string>();
  for (const s of [...spend].sort((a, b) => a.spendCents - b.spendCents)) campaignChannel.set(s.campaignKey, s.channel);
  const channelOf = (s: SignupRow) => (s.campaign ? campaignChannel.get(s.campaign) : undefined) ?? sourceChannel(s.source);
  const channels = new Set<string>([...spend.map((s) => s.channel), ...signups.map(channelOf)]);
  return [...channels]
    .map((channel) => {
      const t = totals(
        spend.filter((s) => s.channel === channel),
        signups.filter((s) => channelOf(s) === channel),
      );
      return { channel, ...t, ...rates(t) };
    })
    .sort((a, b) => b.spendCents - a.spendCents || b.signups - a.signups);
}

export type Ads = Awaited<ReturnType<typeof loadAds>>;

const DAYS = 30;

export async function loadAds(now = new Date()) {
  const since = windowStart(DAYS, now);
  const [spendRows, users, recentSpend] = await Promise.all([
    prisma.adSpend.findMany({ where: { day: { gte: since } } }),
    prisma.user.findMany({
      where: { role: { in: ["STARTUP", "CREATOR"] }, deletedAt: null, createdAt: { gte: since } },
      select: {
        role: true,
        createdAt: true,
        utmSource: true,
        utmCampaign: true,
        startupProfile: {
          select: {
            requests: { select: { interests: { select: { id: true, paidAt: true, paymentStatus: true, platformFeeCents: true } } } },
          },
        },
        creatorProfile: { select: { interests: { select: { id: true, paidAt: true, paymentStatus: true, platformFeeCents: true } } } },
      },
    }),
    prisma.adSpend.findMany({ orderBy: [{ day: "desc" }, { createdAt: "desc" }], take: 40 }),
  ]);

  const signups = users.map((u) => {
    const interests = [...(u.startupProfile?.requests.flatMap((r) => r.interests) ?? []), ...(u.creatorProfile?.interests ?? [])];
    return {
      row: {
        source: u.utmSource,
        campaign: u.utmCampaign,
        role: u.role as "STARTUP" | "CREATOR",
        // A brand is active once it has a request, a creator once it has shown interest.
        activated: (u.startupProfile?.requests.length ?? 0) > 0 || (u.creatorProfile?.interests.length ?? 0) > 0,
        interests: interests.map((i) => ({ id: i.id, paid: i.paidAt !== null, feeCents: i.paymentStatus === "RELEASED" ? (i.platformFeeCents ?? 0) : 0 })),
      } satisfies SignupRow,
      createdAt: u.createdAt,
    };
  });
  const rows = signups.map((s) => s.row);
  const tagged = rows.filter((r) => r.source || r.campaign);

  const spend: SpendRow[] = spendRows;
  const advertised = totals(spend, rows.filter((r) => r.campaign && spend.some((s) => s.campaignKey === r.campaign)));
  const overall = totals(spend, rows);

  return {
    days: DAYS,
    hasSpend: spend.length > 0,
    spendCents: overall.spendCents,
    clicks: overall.clicks,
    impressions: overall.impressions,
    signupsTotal: rows.length,
    signupsTagged: tagged.length,
    // Cost per sign-up only over the sign-ups that came through a campaign with imported spend, so organic ones don't flatter it.
    advertised: { ...advertised, ...rates(advertised) },
    campaigns: aggregateCampaigns(spend, rows),
    channels: aggregateChannels(spend, rows),
    funnel: funnelSteps([
      { label: "Klicks auf Anzeigen", count: advertised.clicks },
      { label: "Angemeldet", count: advertised.signups },
      { label: "Aktiv geworden", count: advertised.activated },
      { label: "Mit bezahlter Collab", count: advertised.payers },
    ]),
    spendByDay: dailySeries(spend, DAYS, (s) => s.day, (s) => s.spendCents, now),
    taggedByDay: dailySeries(signups.filter((s) => s.row.source || s.row.campaign), DAYS, (s) => s.createdAt, () => 1, now),
    recentSpend: recentSpend.map((s) => ({
      id: s.id,
      day: s.day.toISOString().slice(0, 10),
      channel: s.channel,
      name: s.campaignName,
      spendCents: s.spendCents,
      clicks: s.clicks,
      source: s.source,
    })),
  };
}
