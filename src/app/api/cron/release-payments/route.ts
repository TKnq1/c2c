import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseHeldPayment } from "@/lib/payment-release";
import { RELEASE_REVIEW_MS } from "@/lib/constants";

// Run daily by Vercel Cron (see vercel.json): releases every payment whose
// post was submitted more than RELEASE_REVIEW_DAYS ago without the brand
// approving it or reporting a problem. Vercel sends CRON_SECRET as a
// bearer token; without it set, this refuses everything rather than
// letting anyone on the internet trigger releases.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const due = await prisma.interest.findMany({
    where: {
      paymentStatus: "HELD",
      disputedAt: null,
      proofSubmittedAt: { lte: new Date(Date.now() - RELEASE_REVIEW_MS) },
    },
    select: { id: true },
  });

  // One at a time: each is a Stripe transfer plus a couple of writes, and
  // a failure (e.g. a payout account Stripe has since restricted) just
  // leaves that one HELD for tomorrow's run instead of stopping the rest.
  const failed: { id: string; error: string }[] = [];
  for (const { id } of due) {
    const result = await releaseHeldPayment(id, "auto");
    if (result.error) failed.push({ id, error: result.error });
  }

  return NextResponse.json({ due: due.length, released: due.length - failed.length, failed });
}
