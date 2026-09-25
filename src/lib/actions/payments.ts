"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { sendOfferSchema, submitPostSchema, reportProblemSchema } from "@/lib/validation";
import { splitPayment } from "@/lib/payment-math";
import { formatCents } from "@/lib/format";
import { notify } from "@/lib/notifications";
import { flagIfAnomalousOffer } from "@/lib/moderation";
import { RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { refundHeldPayment, releaseHeldPayment, type MoneyMoveResult } from "@/lib/payment-release";

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
    const existing = await stripe.checkout.sessions.retrieve(interest.stripeCheckoutSessionId, {
      expand: ["payment_intent"],
    });
    if (existing.status === "open") return { url: existing.url! };
    // Paid (or a bank debit still clearing) and only waiting on the webhook
    // to flip this to HELD — Stripe sends the brand back here right as it
    // completes, still showing "Pay", and a fresh session from that tap
    // would charge them a second time. A failed debit leaves its intent at
    // requires_payment_method, which falls through to a new session.
    const intent = existing.payment_intent;
    if (existing.payment_status === "paid" || (typeof intent === "object" && intent?.status === "processing")) {
      return { error: "This payment is already going through — it'll show as held in escrow shortly." };
    }
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
    // Names the interest so the page knows which row to wait on while the
    // webhook catches up (see CheckoutReturn).
    success_url: `${SITE_URL}/dashboard/startup/payments?checkout=success&interest=${interest.id}`,
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

// Creator submits the link to their post — this no longer releases
// anything by itself. The brand gets RELEASE_REVIEW_DAYS to approve it
// (releasing the money right away) or report a problem; after that the
// daily job releases it (api/cron/release-payments). Submitting again with
// a corrected link restarts that window, so the brand always gets the full
// time to check the link they're actually approving.
export async function submitPostAction(
  interestId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") {
    return { error: "Not authorized." };
  }

  const parsed = submitPostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Paste the link to your post." };
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
    return { error: "This payment isn't held anymore." };
  }
  if (interest.disputedAt) {
    return { error: "A problem was reported on this collab — we're looking into it, so the link can't change right now." };
  }
  // Checked now rather than only at release: approval pays out on the spot,
  // and a brand shouldn't be approving into an account that can't receive it.
  if (!creator.stripeOnboarded || !creator.stripeAccountId) {
    return { error: "Set up payouts first — the money needs somewhere to go once it's approved." };
  }

  const resubmitted = interest.proofSubmittedAt !== null;
  await prisma.interest.update({
    where: { id: interestId },
    data: { proofUrl: parsed.data.proofUrl, proofSubmittedAt: new Date() },
  });

  await notify(
    interest.request.startup.userId,
    resubmitted
      ? `${creator.displayName} updated the link to their post for "${interest.request.title}" — you have ${RELEASE_REVIEW_DAYS} days to approve it or report a problem`
      : `${creator.displayName} posted the content for "${interest.request.title}" — approve the payment or report a problem within ${RELEASE_REVIEW_DAYS} days`,
    "/dashboard/startup/payments",
    "payments",
  );

  await revalidateOfferPaths(interest.requestId);
  return { success: true };
}

// Loads a HELD payment for one of the brand's own actions on it, or says
// why it can't be acted on.
async function loadBrandHeldPayment(interestId: string, userId: string) {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: { include: { startup: true } }, creator: true },
  });
  if (!interest || interest.request.startup.userId !== userId) return null;
  return interest;
}

// Brand approves the submitted post — the money goes to the creator now.
export async function approvePaymentAction(interestId: string): Promise<MoneyMoveResult> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const interest = await loadBrandHeldPayment(interestId, session.user.id);
  if (!interest) return { error: "This payment could not be found." };
  if (interest.paymentStatus !== "HELD" || !interest.proofSubmittedAt) {
    return { error: "There's no submitted post to approve on this payment." };
  }
  if (interest.disputedAt) return { error: "You reported a problem on this payment — we'll settle it from here." };

  return releaseHeldPayment(interestId, "approved");
}

// Brand says the post isn't what was agreed (missing, taken down, wrong
// content). Freezes the payment — neither approval nor the daily job can
// release it — until an admin releases or refunds it from /admin.
export async function reportProblemAction(
  interestId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const parsed = reportProblemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Tell us what's wrong in a sentence or two." };
  }

  const interest = await loadBrandHeldPayment(interestId, session.user.id);
  if (!interest) return { error: "This payment could not be found." };
  if (interest.disputedAt) return { error: "You already reported a problem — we're looking into it." };

  // Claimed like a release, so a report and the daily job (or a double
  // tap) can't both win: whichever updates the still-open payment first.
  const claimed = await prisma.interest.updateMany({
    where: { id: interestId, paymentStatus: "HELD", disputedAt: null, proofSubmittedAt: { not: null } },
    data: { disputedAt: new Date(), disputeReason: parsed.data.reason },
  });
  if (claimed.count === 0) {
    return { error: "This payment can't be put on hold anymore — it may have just been released. Refresh the page." };
  }

  const brand = interest.request.startup.companyName;
  const title = interest.request.title;
  await notify(
    interest.creator.userId,
    `${brand} reported a problem with your post for "${title}" — the payment is on hold while we look into it`,
    "/dashboard/creator/payments",
    "payments",
  );
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map((a) =>
      notify(
        a.id,
        `Payment dispute: ${brand} reported a problem with ${interest.creator.displayName}'s post for "${title}" (${formatCents(interest.amountCents!)})`,
        "/admin",
        "payments",
      ),
    ),
  );

  await revalidateOfferPaths(interest.requestId);
  revalidatePath("/admin");
  return { success: true };
}

// Brand cancels a payment the creator hasn't submitted a post for yet —
// e.g. they never delivered. Once a post is submitted, a refund only
// happens through a reported problem that an admin settles.
export async function refundPaymentAction(interestId: string): Promise<MoneyMoveResult> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const interest = await loadBrandHeldPayment(interestId, session.user.id);
  if (!interest) return { error: "This payment could not be found." };

  return refundHeldPayment(interestId, "brand");
}
