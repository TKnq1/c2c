import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { cleanUtm } from "@/lib/utm";
import { runAfter } from "@/lib/run-after";

// The landing page, and the start of the sign-up wizard for people who are not signed in yet.
export type VisitPage = "landing" | "onboarding";

// Programs that open pages without a person looking: search engines, link previews, uptime checks. A rough list, so the
// figure is "about": it is for seeing a trend and a campaign's pull, not for billing.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|curl|wget|python|httpclient|headless|lighthouse|pagespeed|monitor|uptime|check/i;

export const isBot = (userAgent: string | null) => !userAgent || BOT.test(userAgent);

// A browser warming up a link it has not been asked to open yet is not a visit.
export function isPrefetch(h: { get(name: string): string | null }) {
  const purpose = `${h.get("purpose") ?? ""} ${h.get("sec-purpose") ?? ""}`.toLowerCase();
  return purpose.includes("prefetch") || h.get("next-router-prefetch") !== null || h.get("x-middleware-prefetch") !== null;
}

const label = (value: string | null | undefined) => (value ? value.slice(0, 60) : "");

// Where the visit came from: the campaign's own name for it (utm_source), else only the name of the site that linked to us,
// never the path or the query. Our own site is "intern", nothing at all is "direkt".
export function visitSource(args: { utmSource?: string | null; referer?: string | null; ownHost: string }): string {
  const utm = cleanUtm(args.utmSource);
  if (utm) return label(utm);
  if (!args.referer) return "direkt";
  try {
    const host = new URL(args.referer).hostname.toLowerCase().replace(/^www\./, "");
    if (!host) return "direkt";
    return host === args.ownHost.replace(/^www\./, "") ? "intern" : label(host);
  } catch {
    return "direkt";
  }
}

const dayOf = (now: Date) => now.toISOString().slice(0, 10);

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Counts one visit of a page. After the response, never fails the page, writes nothing but a counter. Counted: the first
// render of the page for a person (not a bot, not a prefetch).
export function recordVisit(args: { page: VisitPage; headers: { get(name: string): string | null }; searchParams: Search; now?: Date }) {
  const { headers, searchParams } = args;
  if (isBot(headers.get("user-agent")) || isPrefetch(headers)) return;
  const source = visitSource({ utmSource: first(searchParams.utm_source), referer: headers.get("referer"), ownHost: headers.get("host") ?? "" });
  const campaign = label(cleanUtm(first(searchParams.utm_campaign)));
  const day = dayOf(args.now ?? new Date());
  runAfter(async () => {
    // One statement that adds one to the day's counter, so two visits at the same moment both count.
    await prisma.$executeRaw`INSERT INTO "PageView" ("id", "day", "page", "source", "campaign", "views") VALUES (${randomUUID()}, ${day}::date, ${args.page}, ${source}, ${campaign}, 1) ON CONFLICT ("day", "page", "source", "campaign") DO UPDATE SET "views" = "PageView"."views" + 1`;
  });
}
