import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron-auth";
import { runDealDeadlines } from "@/lib/deals/handlers";
import { refreshStaleVatIds } from "@/lib/tax/refresh";

// Reminders, cancellations and documents go out as e-mail now, one after the other: give the run the time it needs.
export const maxDuration = 60;

// Run daily by Vercel Cron (see vercel.json). Carries out what the deal policy says is due: reminders, deemed approvals of
// unanswered drafts, cancellation with refund after a missed deadline, the check that posts are still live, the end of the
// hold window with the payout, the freeze after a removed post that was not republished, and the notices about ad usage
// rights running out. Also catches up invoices that could not be written and re-checks old VAT IDs.
export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const summary = await runDealDeadlines();
  const vatIdsChecked = await refreshStaleVatIds().catch((err) => {
    console.error("Re-checking VAT IDs failed:", err);
    return 0;
  });
  return NextResponse.json({ ...summary, vatIdsChecked });
}
