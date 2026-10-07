import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { pruneMailLog } from "@/lib/mail-log";

const MINUTE = 60 * 1000;
export const SNAPSHOT_MAX_AGE_MS = 10 * MINUTE;
// An event Stripe is still retrying is not a failure yet; only events older than this count.
const STRIPE_SETTLE_MS = 15 * MINUTE;

export type SentryIssue = { id: string; title: string; culprit: string; count: number; users: number; lastSeen: string; level: string; link: string };
export type SentrySnapshot = { ok: true; issues: SentryIssue[]; total: number } | { ok: false; error: string };
export type StripeSnapshot = { ok: true; failed: { id: string; type: string; at: string }[]; total: number } | { ok: false; error: string };

// The Sentry web API sits on the region host of the project, which the DSN's ingest host names:
// o123.ingest.de.sentry.io -> de.sentry.io, o123.ingest.sentry.io -> sentry.io. A self-hosted Sentry uses its own host.
export function sentryApiHost(dsn: string): string | null {
  try {
    const host = new URL(dsn).hostname;
    const stripped = host.replace(/^(?:o\d+\.)?ingest\./, "");
    return stripped || null;
  } catch {
    return null;
  }
}

export function parseSentryIssues(json: unknown): SentryIssue[] {
  if (!Array.isArray(json)) return [];
  return json.slice(0, 10).flatMap((raw) => {
    const i = raw as Record<string, unknown>;
    if (typeof i.id !== "string" || typeof i.title !== "string") return [];
    return [
      {
        id: i.id,
        title: i.title.slice(0, 200),
        culprit: typeof i.culprit === "string" ? i.culprit.slice(0, 160) : "",
        count: Number(i.count) || 0,
        users: Number(i.userCount) || 0,
        lastSeen: typeof i.lastSeen === "string" ? i.lastSeen : "",
        level: typeof i.level === "string" ? i.level : "error",
        link: typeof i.permalink === "string" && i.permalink.startsWith("https://") ? i.permalink : "",
      },
    ];
  });
}

export function sentryConfigured() {
  const set = (name: string) => Boolean(process.env[name]?.trim());
  return set("SENTRY_AUTH_TOKEN") && set("SENTRY_ORG") && set("SENTRY_PROJECT") && set("NEXT_PUBLIC_SENTRY_DSN");
}

async function fetchSentry(): Promise<SentrySnapshot> {
  const host = sentryApiHost(process.env.NEXT_PUBLIC_SENTRY_DSN!.trim());
  if (!host) return { ok: false, error: "Der Sentry-DSN lässt sich nicht lesen." };
  const org = encodeURIComponent(process.env.SENTRY_ORG!.trim());
  const project = encodeURIComponent(process.env.SENTRY_PROJECT!.trim());
  const url = `https://${host}/api/0/projects/${org}/${project}/issues/?query=${encodeURIComponent("is:unresolved")}&statsPeriod=24h&sort=freq&limit=10`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN!.trim()}` },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return { ok: false, error: `Sentry antwortet mit ${response.status}. Prüfe Token, Organisation und Projekt.` };
  const issues = parseSentryIssues(await response.json());
  return { ok: true, issues, total: issues.length };
}

async function fetchStripe(now: Date): Promise<StripeSnapshot> {
  const events = await stripe.events.list({
    delivery_success: false,
    created: { gte: Math.floor((now.getTime() - 24 * 60 * MINUTE) / 1000), lte: Math.floor((now.getTime() - STRIPE_SETTLE_MS) / 1000) },
    limit: 20,
  });
  return {
    ok: true,
    total: events.data.length,
    failed: events.data.map((e) => ({ id: e.id, type: e.type, at: new Date(e.created * 1000).toISOString() })),
  };
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error)).slice(0, 200);

async function refresh<T extends { ok: boolean }>(key: string, load: () => Promise<T>, now: Date) {
  let data: T | { ok: false; error: string };
  try {
    data = await load();
  } catch (error) {
    data = { ok: false, error: message(error) };
  }
  // Errors are stored too, so a broken key is asked about every few minutes and not on every page view.
  const json = data as object as Prisma.InputJsonValue;
  await prisma.externalSnapshot.upsert({ where: { key }, create: { key, data: json, fetchedAt: now }, update: { data: json, fetchedAt: now } });
}

// Brings the stored answers of Sentry and Stripe up to date when they are older than a few minutes, and drops old mail
// log rows. Runs after the response (see the admin layout), never blocks a page, never throws.
export async function refreshExternalSnapshots(now = new Date(), force = false) {
  try {
    const rows = await prisma.externalSnapshot.findMany({ select: { key: true, fetchedAt: true } });
    const stale = (key: string) => force || !rows.some((r) => r.key === key && now.getTime() - r.fetchedAt.getTime() < SNAPSHOT_MAX_AGE_MS);
    const jobs: Promise<unknown>[] = [];
    if (sentryConfigured() && stale("sentry")) jobs.push(refresh("sentry", fetchSentry, now));
    if (process.env.STRIPE_SECRET_KEY?.trim() && stale("stripe")) jobs.push(refresh("stripe", () => fetchStripe(now), now));
    if (stale("mail-prune")) jobs.push(pruneMailLog(now).then(() => prisma.externalSnapshot.upsert({ where: { key: "mail-prune" }, create: { key: "mail-prune", data: {}, fetchedAt: now }, update: { fetchedAt: now } })));
    await Promise.all(jobs);
  } catch (error) {
    console.error("Could not refresh the external snapshots", error);
  }
}

export async function readSnapshots() {
  const rows = await prisma.externalSnapshot.findMany({ where: { key: { in: ["sentry", "stripe"] } } });
  const get = <T>(key: string) => {
    const row = rows.find((r) => r.key === key);
    return row ? { data: row.data as unknown as T, fetchedAt: row.fetchedAt } : null;
  };
  return { sentry: get<SentrySnapshot>("sentry"), stripe: get<StripeSnapshot>("stripe") };
}
