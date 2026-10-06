import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseHeldPayment } from "@/lib/payment-release";
import { RELEASE_REVIEW_MS } from "@/lib/constants";
import { DAY } from "@/lib/rate-limit";

// Run daily by Vercel Cron (see vercel.json): releases every payment whose
// post was submitted more than RELEASE_REVIEW_DAYS ago without the brand
// approving it or reporting a problem. Vercel sends CRON_SECRET as a
// bearer token; without it set, this refuses everything rather than
// letting anyone on the internet trigger releases.
function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // Housekeeping that has no job of its own: rate-limit counters, expired tokens and sessions, and the
  // sign-in/sign-up trail (it holds IP addresses, so it isn't kept longer than it's useful).
  const now = Date.now();
  await Promise.all([
    prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(now - DAY) } } }),
    prisma.revokedSession.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date(now - DAY) } } }),
    prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: new Date(now - DAY) } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now - 90 * DAY) } } }),
    prisma.signupAttempt.deleteMany({ where: { createdAt: { lt: new Date(now - 7 * DAY) } } }),
    // Who a marketing mail went out to isn't kept longer than that is useful (the mailing itself, which holds
    // only its subject, stays).
    prisma.outreachDelivery.deleteMany({ where: { sentAt: { lt: new Date(now - 90 * DAY) } } }),
    // Waitlist addresses nobody confirmed (the privacy policy says 30 days).
    prisma.waitlistEntry.deleteMany({ where: { confirmedAt: null, createdAt: { lt: new Date(now - 30 * DAY) } } }),
  ]).catch((err) => console.error("Housekeeping failed:", err));

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
