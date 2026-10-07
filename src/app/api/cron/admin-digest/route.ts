import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron-auth";
import { refreshExternalSnapshots } from "@/lib/admin-external";
import { runDigests } from "@/lib/admin-digest";

// Run every morning by Vercel Cron (see vercel.json): brings Sentry and Stripe up to date, writes the daily report (and
// the weekly one on Mondays) into the dashboard's inbox and mails the copies. The first visit to the dashboard of the day
// does the same if this job did not run; whichever comes first wins, the other finds the report there.
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const now = new Date();
  await refreshExternalSnapshots(now, true);
  const result = await runDigests(now);
  return NextResponse.json({ ok: true, ...result });
}
