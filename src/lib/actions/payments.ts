"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { sendOfferSchema, releasePaymentSchema } from "@/lib/validation";
import { splitPayment } from "@/lib/payment-math";
import { formatCents } from "@/lib/format";
import { notify } from "@/lib/notifications";
import { flagIfAnomalousOffer } from "@/lib/moderation";

export type PaymentActionState = { error?: string; success?: boolean } | undefined;

type OfferInterest = Awaited<ReturnType<typeof loadInterestForOfferAction>>;

// Loads an interest for an offer-related action, verifying the caller is
// one of its two participants (whichever role they are).
async function loadInterestForOfferAction(interestId: string, role: Role, userId: string) {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: { include: { startup: true } }, creator: true },
  });
  if (!interest) return null;
  if (role === "STARTUP" && interest.request.startup.userId !== userId) return null;
  if (role === "CREATOR" && interest.creator.userId !== userId) return null;
  return interest;
}

function otherPartyUserId(interest: NonNullable<OfferInterest>, role: Role) {
  return role === "STARTUP" ? interest.creator.userId : interest.request.startup.userId;
}

function actorName(interest: NonNullable<OfferInterest>, role: Role) {
  return role === "STARTUP" ? interest.request.startup.companyName : interest.creator.displayName;
}

function paymentsHref(role: Role) {
  return role === "STARTUP" ? "/dashboard/creator/payments" : "/dashboard/startup/payments";
}

async function revalidateOfferPaths(requestId: string) {
  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
}

// Brand sends the opening offer to one interested creator. No money moves
// yet — the creator has to accept it first, same as the deposit flow
// requires the creator to actively pay it.
export async function sendOfferAction(
  interestId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    return { error: "Not authorized." };
  }

  const parsed = sendOfferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid offer amount." };
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: true, creator: true },
  });

  if (!interest || interest.request.startupId !== startup.id) {
    return { error: "This interest could not be found." };
  }
  if (interest.paymentStatus !== null) {
    return { error: "There's already an offer or payment in progress for this creator." };
  }

  const amountCents = parsed.data.amount;
  const { platformFeeCents, payoutCents } = splitPayment(amountCents, startup.isPro);

  await prisma.interest.update({
    where: { id: interestId },
    data: { amountCents, platformFeeCents, payoutCents, paymentStatus: "OFFERED", offerRole: "STARTUP", offeredAt: new Date() },
  });

  // startup.createdAt doubles as account age — the profile is always
  // created in the same insert as the User at signup, never later.
  await flagIfAnomalousOffer(startup.createdAt, amountCents, session.user.id);

  await notify(
    interest.creator.userId,
    `${startup.companyName} sent you an offer of ${formatCents(amountCents)} for "${interest.request.title}"`,
    "/dashboard/creator/payments",
    "payments",
  );

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
  return { success: true };
}

// Same offer, sent to several not-yet-offered interested creators on one
// request at once — e.g. a brand running a campaign with the same budget
// per creator shouldn't have to repeat the single-offer flow N times.
// Silently skips any interestId that's no longer eligible (already offered
// elsewhere in the meantime) rather than failing the whole batch over one
// stale selection.
export async function bulkSendOfferAction(requestId: string, interestIds: string[], formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  const parsed = sendOfferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Please enter a valid offer amount.");
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request || request.startupId !== startup.id) throw new Error("This request could not be found.");

  const interests = await prisma.interest.findMany({
    where: { id: { in: interestIds }, requestId, paymentStatus: null },
    include: { creator: true },
  });

  const amountCents = parsed.data.amount;
  const { platformFeeCents, payoutCents } = splitPayment(amountCents, startup.isPro);

  await Promise.all(
    interests.map(async (interest) => {
      await prisma.interest.update({
        where: { id: interest.id },
        data: { amountCents, platformFeeCents, payoutCents, paymentStatus: "OFFERED", offerRole: "STARTUP", offeredAt: new Date() },
      });
      await notify(
        interest.creator.userId,
        `${startup.companyName} sent you an offer of ${formatCents(amountCents)} for "${request.title}"`,
        "/dashboard/creator/payments",
        "payments",
      );
    }),
  );

  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup/payments");
  return { count: interests.length };
}

// Counters an offer that's currently awaiting the caller's response —
// proposes a different amount and flips the ball back to the other side.
// Either role can call this: a creator countering the brand's offer, or a
// brand countering the creator's counter.
export async function counterOfferAction(
  interestId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };
  const role = session.user.role;
  if (role !== "STARTUP" && role !== "CREATOR") return { error: "Not authorized." };

  const parsed = sendOfferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid offer amount." };
  }

  const interest = await loadInterestForOfferAction(interestId, role, session.user.id);
  if (!interest) return { error: "This offer could not be found." };
  if (interest.paymentStatus !== "OFFERED" || interest.offerRole === role) {
    return { error: "This offer isn't awaiting your response." };
  }

  const amountCents = parsed.data.amount;
  const { platformFeeCents, payoutCents } = splitPayment(amountCents, interest.request.startup.isPro);

  await prisma.interest.update({
    where: { id: interestId },
    data: { amountCents, platformFeeCents, payoutCents, offerRole: role, offeredAt: new Date() },
  });

  // Same account-age signal as the opening offer, just sourced from
  // whichever side is doing the countering this time.
  const counterAccountCreatedAt = role === "STARTUP" ? interest.request.startup.createdAt : interest.creator.createdAt;
  await flagIfAnomalousOffer(counterAccountCreatedAt, amountCents, session.user.id);

  await notify(
    otherPartyUserId(interest, role),
    `${actorName(interest, role)} countered with ${formatCents(amountCents)} for "${interest.request.title}"`,
    paymentsHref(role),
    "payments",
  );

  await revalidateOfferPaths(interest.requestId);
  return { success: true };
}

// Withdraws a proposal that's still yours and unanswered — e.g. a typo in
// the amount. Clears the offer back to "not paid yet" so a fresh one can
// be sent. Works for either side's own pending proposal.
export async function withdrawOfferAction(interestId: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");
  const role = session.user.role;
  if (role !== "STARTUP" && role !== "CREATOR") throw new Error("Not authorized.");

  const interest = await loadInterestForOfferAction(interestId, role, session.user.id);
  if (!interest) throw new Error("This offer could not be found.");
  if (interest.paymentStatus !== "OFFERED" || interest.offerRole !== role) {
    throw new Error("This offer isn't yours to withdraw.");
  }

  await prisma.interest.update({
    where: { id: interestId },
    data: { paymentStatus: null, amountCents: null, platformFeeCents: null, payoutCents: null, offerRole: null, offeredAt: null },
  });

  await notify(
    otherPartyUserId(interest, role),
    `${actorName(interest, role)} withdrew their offer for "${interest.request.title}"`,
    paymentsHref(role),
    "payments",
  );

  await revalidateOfferPaths(interest.requestId);
}

// Accepts a proposal awaiting the caller's response — this is the moment
// money actually moves into escrow (still held, not released, until the
// content is posted). Works for either direction: a creator accepting the
// brand's offer, or a brand accepting the creator's counter.
export async function acceptOfferAction(interestId: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");
  const role = session.user.role;
  if (role !== "STARTUP" && role !== "CREATOR") throw new Error("Not authorized.");

  const interest = await loadInterestForOfferAction(interestId, role, session.user.id);
  if (!interest) throw new Error("This offer could not be found.");
  if (interest.paymentStatus !== "OFFERED" || interest.offerRole === role) {
    throw new Error("This offer isn't awaiting your response.");
  }

  // offerRole is deliberately left as-is (not cleared) — once accepted it's
  // no longer read for authorization, but it's a harmless historical record
  // of who proposed the accepted price, useful for the collab timeline.
  //
  // Not HELD yet — the brand still has to actually pay via Stripe Checkout
  // (createCheckoutSessionAction). Real money only starts existing once the
  // webhook confirms it, regardless of which side clicked accept here.
  await prisma.interest.update({
    where: { id: interestId },
    data: { paymentStatus: "ACCEPTED", acceptedAt: new Date() },
  });

  const startupUserId = interest.request.startup.userId;
  const message =
    role === "STARTUP"
      ? `${actorName(interest, role)} accepted your offer of ${formatCents(interest.amountCents!)} for "${interest.request.title}" — waiting on the brand to complete payment`
      : `${actorName(interest, role)} accepted your offer of ${formatCents(interest.amountCents!)} for "${interest.request.title}" — head to Payments to pay and hold it in escrow`;
  await notify(otherPartyUserId(interest, role), message, paymentsHref(role), "payments");
  // The brand always needs a nudge to actually pay, even when they were the
  // one who clicked accept just now (they already know in that case, but
  // this keeps the notification consistent with "you have something to pay").
  if (role === "CREATOR") {
    await notify(
      startupUserId,
      `Accepted — pay ${formatCents(interest.amountCents!)} for "${interest.request.title}" to hold it in escrow`,
      "/dashboard/startup/payments",
      "payments",
    );
  }

  await revalidateOfferPaths(interest.requestId);
}

// Brand starts (or resumes) a Stripe Checkout for an accepted offer.
// Separate charges and transfers pattern (see .agents/skills/stripe-best-practices):
// the charge lands on the platform account — no transfer_data — so the
// platform can hold it until release, then transfer the creator's payout
// out of that same charge. This is also why application_fee_amount is never
// used here: the fee is just the gap between amountCents and payoutCents.
export async function createCheckoutSessionAction(interestId: string): Promise<{ url: string } | { error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: true, creator: true },
  });

  if (!interest || interest.request.startupId !== startup.id) return { error: "This interest could not be found." };
  if (interest.paymentStatus !== "ACCEPTED") return { error: "This offer isn't ready for payment." };

  // Reuse a still-open session rather than always minting a new one —
  // stripeCheckoutSessionId is unique per interest, so overwriting it while
  // an earlier session is still open (e.g. two tabs) would orphan that
  // session's id: if the brand finishes paying on it anyway, the webhook's
  // lookup by session id would find nothing and silently drop a real charge.
  if (interest.stripeCheckoutSessionId) {
    const existing = await stripe.checkout.sessions.retrieve(interest.stripeCheckoutSessionId);
    if (existing.status === "open") return { url: existing.url! };
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: interest.amountCents!,
          product_data: { name: `Collab with ${interest.creator.displayName}: "${interest.request.title}"` },
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/dashboard/startup/payments?checkout=success`,
    cancel_url: `${SITE_URL}/dashboard/startup/payments?checkout=cancelled`,
    metadata: { interestId: interest.id },
  });

  await prisma.interest.update({
    where: { id: interestId },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  return { url: checkoutSession.url! };
}

// Declines a proposal awaiting the caller's response — clears it back to
// "not paid yet" so the other side can start over with a new offer.
export async function declineOfferAction(interestId: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");
  const role = session.user.role;
  if (role !== "STARTUP" && role !== "CREATOR") throw new Error("Not authorized.");

  const interest = await loadInterestForOfferAction(interestId, role, session.user.id);
  if (!interest) throw new Error("This offer could not be found.");
  if (interest.paymentStatus !== "OFFERED" || interest.offerRole === role) {
    throw new Error("This offer isn't awaiting your response.");
  }

  await prisma.interest.update({
    where: { id: interestId },
    data: { paymentStatus: null, amountCents: null, platformFeeCents: null, payoutCents: null, offerRole: null, offeredAt: null },
  });

  await notify(
    otherPartyUserId(interest, role),
    `${actorName(interest, role)} declined your offer for "${interest.request.title}"`,
    paymentsHref(role),
    "payments",
  );

  await revalidateOfferPaths(interest.requestId);
}

// Creator marks their work as posted, releasing a HELD payment to
// themselves. The link to the post is optional — same honor-system trust
// level as the release itself — but gives the brand something to check.
export async function releasePaymentAction(
  interestId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") {
    return { error: "Not authorized." };
  }

  const parsed = releasePaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid link." };
  }

  const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: { include: { startup: true } } },
  });

  if (!interest || interest.creatorId !== creator.id) {
    return { error: "This payment could not be found." };
  }
  if (interest.paymentStatus !== "HELD") {
    return { error: "This payment is not currently held." };
  }
  if (!creator.stripeOnboarded || !creator.stripeAccountId) {
    return { error: "Connect Stripe in Settings → Payouts before releasing a payment." };
  }

  // Atomic claim before touching Stripe: a double-click or a retried
  // request could otherwise both pass the HELD check above and each fire a
  // real transfer, paying the creator twice out of the platform's own
  // margin. Only the request whose updateMany actually matches a row (still
  // HELD at that instant) proceeds — a second concurrent call sees 0 rows
  // updated and bails out below instead of calling Stripe at all.
  const claimed = await prisma.interest.updateMany({
    where: { id: interestId, creatorId: creator.id, paymentStatus: "HELD" },
    data: { paymentStatus: "RELEASED", releasedAt: new Date(), proofUrl: parsed.data.proofUrl || null },
  });
  if (claimed.count === 0) {
    return { error: "This payment is not currently held." };
  }

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
    // Give the creator a working retry instead of a stuck "Released" with
    // no money actually transferred.
    await prisma.interest.update({
      where: { id: interestId },
      data: { paymentStatus: "HELD", releasedAt: null, proofUrl: null },
    });
    return { error: "Releasing the payment failed. Please try again." };
  }

  await prisma.interest.update({
    where: { id: interestId },
    data: { stripeTransferId: transfer.id },
  });

  await notify(
    interest.request.startup.userId,
    `${creator.displayName} marked the work as posted — your payment of ${formatCents(interest.amountCents!)} for "${interest.request.title}" was released`,
    "/dashboard/startup/payments",
    "payments",
  );

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
  return { success: true };
}

// Brand cancels a payment that's still HELD — e.g. the creator never
// delivered. Simulated refund: same honor-system trust level as release
// (neither side's claim is independently verified), just reversed.
export async function refundPaymentAction(interestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    throw new Error("Not authorized.");
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: true, creator: true },
  });

  if (!interest || interest.request.startupId !== startup.id) {
    throw new Error("This payment could not be found.");
  }
  if (interest.paymentStatus !== "HELD") {
    throw new Error("This payment is not currently held.");
  }

  // Same atomic-claim-before-Stripe-call pattern as releasePaymentAction —
  // see the comment there for why. Here it guards against a double refund.
  const claimed = await prisma.interest.updateMany({
    where: { id: interestId, requestId: interest.requestId, paymentStatus: "HELD" },
    data: { paymentStatus: "REFUNDED", refundedAt: new Date() },
  });
  if (claimed.count === 0) {
    throw new Error("This payment is not currently held.");
  }

  // Nothing was ever transferred out at HELD (separate charges and
  // transfers — the transfer only happens on release), so a plain refund
  // of the original charge is the whole reversal; no transfer to claw back.
  let refund;
  try {
    refund = await stripe.refunds.create(
      { charge: interest.stripeChargeId! },
      { idempotencyKey: `refund-${interestId}` },
    );
  } catch {
    await prisma.interest.update({ where: { id: interestId }, data: { paymentStatus: "HELD", refundedAt: null } });
    throw new Error("Refunding the payment failed. Please try again.");
  }

  await prisma.interest.update({
    where: { id: interestId },
    data: { stripeRefundId: refund.id },
  });

  await notify(
    interest.creator.userId,
    `${startup.companyName} cancelled and refunded the payment for "${interest.request.title}"`,
    "/dashboard/creator/payments",
    "payments",
  );

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
}
