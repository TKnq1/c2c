import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// The caller's network address. Vercel sets x-vercel-forwarded-for itself and
// a client can't supply it; the others are fallbacks for other hosting and for
// local development, where no header at all means "unknown": null outside
// production (so nothing keyed by it is limited while developing), a shared
// "unknown" bucket in production (so a missing header can't be used to dodge a
// limit).
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  if (ip) return ip;
  return process.env.NODE_ENV === "production" ? "unknown" : null;
}

// true = allowed (and counted), false = over the limit. A fixed lookback
// window per bucket+key; old rows are removed by the daily cron.
export async function takeToken(bucket: string, key: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const used = await prisma.rateLimitHit.count({ where: { bucket, key, createdAt: { gte: since } } });
  if (used >= limit) return false;
  await prisma.rateLimitHit.create({ data: { bucket, key } });
  return true;
}

// The same, keyed by the caller's network address.
export async function takeIpToken(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = await clientIp();
  if (!ip) return true;
  return takeToken(bucket, ip, limit, windowMs);
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
