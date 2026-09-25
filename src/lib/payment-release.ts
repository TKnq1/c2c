import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { notify } from "@/lib/notifications";
import { formatCents } from "@/lib/format";
import { RELEASE_REVIEW_DAYS, RELEASE_REVIEW_MS } from "@/lib/constants";

// The only two ways money leaves escrow: to the creator (the brand
// approved the post, the review window ran out, or an admin settled a
// dispute that way) or back to the brand (cancelled before anything was
// posted, or an admin settled a dispute that way). Both return an error
// message rather than throwing — React strips thrown messages in
// production, and "hasn't finished setting up payouts" is one the person
// who clicked needs to actually read.
export type MoneyMoveResult = { error?: string };

export type ReleaseTrigger = "approved" | "auto" | "admin";
export type RefundTrigger = "brand" | "admin";

function revalidatePaymentPaths(requestId: string) {
  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
  revalidatePath("/admin");
}

export async function releaseHeldPayment(interestId: string, trigger: ReleaseTrigger): Promise<MoneyMoveResult> {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { creator: true, request: { include: { startup: true } } },
  });
  if (!interest || interest.paymentStatus !== "HELD") return { error: "This payment isn't held anymore." };
  const { creator } = interest;
  if (!creator.stripeOnboarded || !creator.stripeAccountId) {
    return { error: `${creator.displayName} hasn't finished setting up payouts yet, so it can't be released.` };
  }

  // Atomic claim before touching Stripe: a double-click, a retried request,
  // or the brand and the daily job acting at the same moment could
  // otherwise all pass the HELD check above and each fire a real transfer,
  // paying the creator twice out of the platform's own margin. Only the
  // call whose updateMany actually matches a row proceeds. The conditions
  // are also what keep the three triggers apart: approval and the daily job
  // both lose to a problem reported a moment earlier, and the daily job to
  // a link resubmitted (which restarts the window) since it looked.
  const claimWhere: Prisma.InterestWhereInput =
    trigger === "admin"
      ? { paymentStatus: "HELD" }
      : trigger === "approved"
        ? { paymentStatus: "HELD", disputedAt: null, proofSubmittedAt: { not: null } }
        : { paymentStatus: "HELD", disputedAt: null, proofSubmittedAt: { lte: new Date(Date.now() - RELEASE_REVIEW_MS) } };
  const claimed = await prisma.interest.updateMany({
    where: { id: interestId, ...claimWhere },
    data: { paymentStatus: "RELEASED", releasedAt: new Date() },
  });
  if (claimed.count === 0) return { error: "This payment can't be released right now — refresh the page." };

  // Transfer-math fee retention, not application_fee_amount (that's only
  // for destination/direct charges) — transferring payoutCents rather than
  // amountCents out of the original charge is how the platform fee stays
  // with the platform under separate charges and transfers. idempotencyKey
  // means a retry of this exact call (e.g. after a network error) can't
  // create a second transfer even if the DB claim above already succeeded.
  let transfer;
  try {
    transfer = await stripe.transfers.create(
      {
        amount: interest.payoutCents!,
        currency: "eur",
        destination: creator.stripeAccountId,
        source_transaction: interest.stripeChargeId!,
      },
      { idempotencyKey: `release-${interestId}` },
    );
  } catch {
    // Back to HELD so it can be retried, instead of a stuck "Released" with
    // no money actually transferred.
    await prisma.interest.update({ where: { id: interestId }, data: { paymentStatus: "HELD", releasedAt: null } });
    return { error: "Releasing the payment failed. Please try again." };
  }

  await prisma.interest.update({ where: { id: interestId }, data: { stripeTransferId: transfer.id } });

  const title = interest.request.title;
  const brand = interest.request.startup.companyName;
  const payout = formatCents(interest.payoutCents!);
  const creatorMessage = {
    approved: `${brand} approved your post for "${title}" — ${payout} is on its way to you`,
    auto: `Your ${payout} for "${title}" was released — ${brand} didn't report a problem within ${RELEASE_REVIEW_DAYS} days`,
    admin: `We reviewed the problem reported on "${title}" and released your ${payout}`,
  }[trigger];
  await notify(creator.userId, creatorMessage, "/dashboard/creator/payments", "payments");
  // The brand clicked Approve themselves — no need to tell them about it.
  if (trigger !== "approved") {
    await notify(
      interest.request.startup.userId,
      trigger === "auto"
        ? `Your ${formatCents(interest.amountCents!)} for "${title}" was released to ${creator.displayName} — no problem was reported within ${RELEASE_REVIEW_DAYS} days`
        : `We reviewed the problem you reported on "${title}" and released the payment to ${creator.displayName}`,
      "/dashboard/startup/payments",
      "payments",
    );
  }

  revalidatePaymentPaths(interest.requestId);
  return {};
}

export async function refundHeldPayment(interestId: string, trigger: RefundTrigger): Promise<MoneyMoveResult> {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { creator: true, request: { include: { startup: true } } },
  });
  if (!interest || interest.paymentStatus !== "HELD") return { error: "This payment isn't held anymore." };
  if (trigger === "brand" && interest.proofSubmittedAt) {
    return {
      error: `${interest.creator.displayName} already submitted their post — report a problem instead, and we'll look into it.`,
    };
  }

  // Same atomic-claim-before-Stripe-call pattern as releaseHeldPayment —
  // here it guards against a double refund, and against a brand cancelling
  // in the same moment the creator submits their post.
  const claimed = await prisma.interest.updateMany({
    where: { id: interestId, paymentStatus: "HELD", ...(trigger === "brand" ? { proofSubmittedAt: null } : {}) },
    data: { paymentStatus: "REFUNDED", refundedAt: new Date() },
  });
  if (claimed.count === 0) return { error: "This payment can't be refunded right now — refresh the page." };

  // Nothing was ever transferred out at HELD (separate charges and
  // transfers — the transfer only happens on release), so a plain refund
  // of the original charge is the whole reversal; no transfer to claw back.
  let refund;
  try {
    refund = await stripe.refunds.create({ charge: interest.stripeChargeId! }, { idempotencyKey: `refund-${interestId}` });
  } catch {
    await prisma.interest.update({ where: { id: interestId }, data: { paymentStatus: "HELD", refundedAt: null } });
    return { error: "Refunding the payment failed. Please try again." };
  }

  await prisma.interest.update({ where: { id: interestId }, data: { stripeRefundId: refund.id } });

  const title = interest.request.title;
  const brand = interest.request.startup.companyName;
  await notify(
    interest.creator.userId,
    trigger === "brand"
      ? `${brand} cancelled and refunded the payment for "${title}"`
      : `We reviewed the problem reported on "${title}" and refunded ${brand}`,
    "/dashboard/creator/payments",
    "payments",
  );
  if (trigger === "admin") {
    await notify(
      interest.request.startup.userId,
      `We reviewed the problem you reported on "${title}" and refunded your ${formatCents(interest.amountCents!)}`,
      "/dashboard/startup/payments",
      "payments",
    );
  }

  revalidatePaymentPaths(interest.requestId);
  return {};
}
