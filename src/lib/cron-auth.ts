import { timingSafeEqual } from "crypto";

// Vercel Cron sends CRON_SECRET as a bearer token. Without the secret set, every call is refused rather than letting
// anyone on the internet start a job.
export function cronAuthorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
