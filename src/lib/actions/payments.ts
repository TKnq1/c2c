"use server";

import { notifyUrgent } from "@/lib/admin-digest";
import { formatNoticeBody } from "@/lib/admin-notice-format";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { sendOfferSchema, submitPostSchema, reportProblemSchema } from "@/lib/validation";
import { hasProRate, splitPayment } from "@/lib/payment-math";
import { formatCents } from "@/lib/format";
import { notify } from "@/lib/notifications";
import { flagIfAnomalousOffer, getMutualBlockedUserIds, isBlocked } from "@/lib/moderation";
import { DAY, takeToken } from "@/lib/rate-limit";
import { VERIFY_EMAIL_MESSAGE, emailIsVerified } from "@/lib/verified";
import { RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { refundHeldPayment, releaseHeldPayment, type MoneyMoveResult } from "@/lib/payment-release";
import { recordProposal, settleProposal } from "@/lib/offer-events";
import { getLocale } from "@/lib/i18n/server";
import { dealLocale, firstErrorMessage } from "@/lib/deals/copy";
import { briefingBlockers, createDealInTx } from "@/lib/deals/create";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import { parseTaxSnapshot } from "@/lib/deals/parties";

export type PaymentActionState = { error?: string; success?: boolean } | undefined;

type OfferInterest = Awaited<ReturnType<typeof loadInterestForOfferAction>>;

// Loads an interest for an offer-related action, verifying the caller is
// one of its two participants (whichever role they are).
async function loadInterestForOfferAction(interestId: string, role: Role, userId: string) {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: { include: { startup: true, briefing: true } }, creator: true },
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

// An offer is made (and accepted) under the request's campaign rules. A request without a briefing gets the German
// defaults; one whose rules are unlawful or unworkable (no advertising label, a posting window in the past, ...) blocks
// the offer until the brand fixes the briefing.
async function briefingRefusal(request: Parameters<typeof briefingBlockers>[0]): Promise<string | null> {
  const blockers = briefingBlockers(request);
  if (blockers.length === 0) return null;
  const locale = dealLocale(await getLocale());
  const lead = locale === "de" ? "Das Kampagnen-Briefing muss noch angepasst werden: " : "The campaign briefing needs work first: ";
  return `${lead}${firstErrorMessage(blockers, locale)}`;
}

// A collab that runs as a brand deal is handled on its deal page; the old approve / report / refund buttons do not apply.
async function dealBlock(interestId: string): Promise<string | null> {
  const deal = await prisma.deal.findUnique({ where: { interestId }, select: { id: true } });
  if (!deal) return null;
  return dealLocale(await getLocale()) === "de"
    ? "Diese Kooperation läuft als Brand Deal. Alles Weitere findest du unter Deals."
    : "This collab runs as a brand deal. Continue under Deals.";
}

async function revalidateOfferPaths(requestId: string, interestId?: string) {
  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
  if (interestId) {
    revalidatePath("/dashboard/messages");
    revalidatePath(`/dashboard/messages/${interestId}`);
  }
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
    include: { request: { include: { briefing: true } }, creator: true },
  });

  if (!interest || interest.request.startupId !== startup.id) {
    return { error: "This interest could not be found." };
  }
  const briefingProblem = await briefingRefusal(interest.request);
  if (briefingProblem) return { error: briefingProblem };
  if (interest.paymentStatus !== null) {
    return { error: "There's already an offer or payment in progress for this creator." };
  }
  if (!(await emailIsVerified(session.user.id))) return { error: VERIFY_EMAIL_MESSAGE };
  // A creator who blocked this brand isn't offered anything, however the brand got to the interest.
  if (await isBlocked(session.user.id, interest.creator.userId)) {
    return { error: "This interest could not be found." };
  }
  if (!(await takeToken("offer", session.user.id, 100, DAY))) {
    return { error: "You've sent a lot of offers today. Try again tomorrow." };
  }

  const amountCents = parsed.data.amount;
  const { platformFeeCents, payoutCents } = splitPayment(amountCents, hasProRate(startup, interest.creator));

  // Only while nothing is on the table: two parallel sends can't both go through.
  const opened = await prisma.$transaction(async (tx) => {
    const claimed = await tx.interest.updateMany({
      where: { id: interestId, paymentStatus: null },
      data: { amountCents, platformFeeCents, payoutCents, paymentStatus: "OFFERED", offerRole: "STARTUP", offeredAt: new Date() },
    });
    if (claimed.count !== 1) return false;
    await recordProposal(tx, { interestId, role: "STARTUP", amountCents, payoutCents });
    return true;
  });
  if (!opened) return { error: "There's already an offer or payment in progress for this creator." };

  // startup.createdAt doubles as account age — the profile is always
  // created in the same insert as the User at signup, never later.
  await flagIfAnomalousOffer(startup.createdAt, amountCents, session.user.id);

  await notify(
    interest.creator.userId,
    `${startup.companyName} sent you an offer of ${formatCents(amountCents)} for "${interest.request.title}"`,
    "/dashboard/creator/payments",
    "payments",
  );

  await revalidateOfferPaths(interest.requestId, interestId);
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

  if (!(await emailIsVerified(session.user.id))) throw new Error(VERIFY_EMAIL_MESSAGE);

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({ where: { id: requestId }, include: { briefing: true } });
  if (!request || request.startupId !== startup.id) throw new Error("This request could not be found.");
  const briefingProblem = await briefingRefusal(request);
  if (briefingProblem) throw new Error(briefingProblem);

  // Whoever has blocked this brand (or was blocked by it) is left out of the batch.
  const blocked = new Set(await getMutualBlockedUserIds(session.user.id));
  const interests = (
    await prisma.interest.findMany({
      where: { id: { in: interestIds.slice(0, 100) }, requestId, paymentStatus: null },
      include: { creator: true },
    })
  ).filter((i) => !blocked.has(i.creator.userId));
  if (interests.length > 0 && !(await takeToken("offer", session.user.id, 100, DAY))) {
    throw new Error("You've sent a lot of offers today. Try again tomorrow.");
  }

  const amountCents = parsed.data.amount;

  const offered: typeof interests = [];
  await prisma.$transaction(async (tx) => {
    for (const interest of interests) {
      // Per creator: one with Pro gets the Pro rate even when the brand has none.
      const { platformFeeCents, payoutCents } = splitPayment(amountCents, hasProRate(startup, interest.creator));
      // Skipped quietly if it was offered elsewhere since the list was read.
      const claimed = await tx.interest.updateMany({
        where: { id: interest.id, paymentStatus: null },
        data: { amountCents, platformFeeCents, payoutCents, paymentStatus: "OFFERED", offerRole: "STARTUP", offeredAt: new Date() },
      });
      if (claimed.count !== 1) continue;
      await recordProposal(tx, { interestId: interest.id, role: "STARTUP", amountCents, payoutCents });
      offered.push(interest);
    }
  });

  await Promise.all(
    offered.map((interest) =>
      notify(
        interest.creator.userId,
        `${startup.companyName} sent you an offer of ${formatCents(amountCents)} for "${request.title}"`,
        "/dashboard/creator/payments",
        "payments",
      ),
    ),
  );

  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup/payments");
  return { count: offered.length };
}

// Counters an offer that's currently awaiting the caller's response —
// proposes a different amount and flips the ball back to the other side.
// Either role can call this: a creator countering the brand's offer, or a
// brand countering the creator's counter.
export async function counterOfferAction(
  interestId: string,
  // The amount on the offer the person is looking at: the answer only counts if that offer is still the one on the table.
  expectedAmountCents: number,
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
  const { platformFeeCents, payoutCents } = splitPayment(amountCents, hasProRate(interest.request.startup, interest.creator));

  const countered = await prisma.$transaction(async (tx) => {
    const claimed = await tx.interest.updateMany({
      where: { id: interestId, paymentStatus: "OFFERED", offerRole: { not: role }, amountCents: expectedAmountCents },
      data: { amountCents, platformFeeCents, payoutCents, offerRole: role, offeredAt: new Date() },
    });
    if (claimed.count !== 1) return false;
    await recordProposal(tx, { interestId, role, amountCents, payoutCents });
    return true;
  });
  if (!countered) return { error: "The offer changed in the meantime. Please look at the new offer." };

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

  await revalidateOfferPaths(interest.requestId, interestId);
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

  // Only an offer that is still this person's and unanswered: an accept that lands first stays accepted.
  const withdrawn = await prisma.$transaction(async (tx) => {
    const claimed = await tx.interest.updateMany({
      where: { id: interestId, paymentStatus: "OFFERED", offerRole: role },
      data: { paymentStatus: null, amountCents: null, platformFeeCents: null, payoutCents: null, offerRole: null, offeredAt: null },
    });
    if (claimed.count !== 1) return false;
    await settleProposal(tx, interestId, "WITHDRAWN");
    return true;
  });
  if (!withdrawn) throw new Error("This offer changed in the meantime.");

  await notify(
    otherPartyUserId(interest, role),
    `${actorName(interest, role)} withdrew their offer for "${interest.request.title}"`,
    paymentsHref(role),
    "payments",
  );

  await revalidateOfferPaths(interest.requestId, interestId);
}

// Accepts a proposal awaiting the caller's response — this is the moment
// money actually moves into escrow (still held, not released, until the
// content is posted). Works for either direction: a creator accepting the
// brand's offer, or a brand accepting the creator's counter.
//
// `expectedAmountCents` is the amount on the card the person pressed Accept on:
// it only counts if that offer is still the one on the table. Without it, an
// offer that was withdrawn and re-sent at another price in the meantime was
// accepted at the new price.
export async function acceptOfferAction(interestId: string, expectedAmountCents: number) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");
  const role = session.user.role;
  if (role !== "STARTUP" && role !== "CREATOR") throw new Error("Not authorized.");

  const interest = await loadInterestForOfferAction(interestId, role, session.user.id);
  if (!interest) throw new Error("This offer could not be found.");
  if (interest.paymentStatus !== "OFFERED" || interest.offerRole === role) {
    throw new Error("This offer isn't awaiting your response.");
  }
  // The deal is made under the request's campaign rules: if they are unlawful or unworkable, nothing is accepted.
  const briefingProblem = await briefingRefusal(interest.request);
  if (briefingProblem) throw new Error(briefingProblem);

  // offerRole is deliberately left as-is (not cleared) — once accepted it's
  // no longer read for authorization, but it's a harmless historical record
  // of who proposed the accepted price, useful for the collab timeline.
  //
  // Not HELD yet. The accepted offer becomes a brand deal (briefing terms frozen as the contract): both sides confirm
  // it, and only then does the brand fund the escrow through Stripe Checkout (createCheckoutSessionAction). Real money
  // only starts existing once the webhook confirms it, regardless of which side clicked accept here.
  const dealId = await prisma.$transaction(async (tx) => {
    const claimed = await tx.interest.updateMany({
      where: { id: interestId, paymentStatus: "OFFERED", offerRole: { not: role }, amountCents: expectedAmountCents },
      data: { paymentStatus: "ACCEPTED", acceptedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    await settleProposal(tx, interestId, "ACCEPTED");
    // Read after the claim: the fee on the offer may have moved to the Pro rate since the page was loaded.
    const fresh = await tx.interest.findUniqueOrThrow({ where: { id: interestId } });
    const deal = await createDealInTx(tx, {
      id: fresh.id,
      creatorId: fresh.creatorId,
      amountCents: fresh.amountCents,
      payoutCents: fresh.payoutCents,
      platformFeeCents: fresh.platformFeeCents,
      request: interest.request,
      creator: interest.creator,
    });
    return deal.id;
  });
  if (!dealId) throw new Error("The offer changed in the meantime. Please look at the new offer.");

  const link = dealHref(dealId);
  await notifyDealParty(interest.request.startup.userId, "deal_created", { title: interest.request.title }, link);
  await notifyDealParty(interest.creator.userId, "deal_created", { title: interest.request.title }, link);

  await revalidateOfferPaths(interest.requestId, interestId);
  revalidatePath("/dashboard/deals");
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
  if (!(await emailIsVerified(session.user.id))) return { error: VERIFY_EMAIL_MESSAGE };

  // A brand deal is paid only once both sides confirmed the contract, and the brand pays what the tax engine fixed then:
  // the net price plus VAT where German VAT applies. Without a deal (an older collab) the price is all there is.
  const deal = await prisma.deal.findUnique({
    where: { interestId },
    select: { id: true, status: true, brandNetCents: true, brandVatCents: true, brandTotalCents: true, taxSnapshot: true },
  });
  if (deal && (deal.status !== "AWAITING_ESCROW" || deal.brandTotalCents === null || deal.brandNetCents === null)) {
    return {
      error:
        dealLocale(await getLocale()) === "de"
          ? "Beide Seiten müssen zuerst den Vertrag bestätigen. Das geht auf der Deal-Seite."
          : "Both sides have to confirm the contract first. You can do that on the deal page.",
    };
  }
  const netCents = deal?.brandNetCents ?? interest.amountCents!;
  const vatCents = deal?.brandVatCents ?? 0;
  const totalCents = deal?.brandTotalCents ?? interest.amountCents!;
  const vatRateBp = deal ? (parseTaxSnapshot(deal.taxSnapshot)?.tax.brand.rateBp ?? 0) : 0;

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
      return { error: "This payment is already going through. It'll show as held in escrow shortly." };
    }
  }

  // Two parallel clicks start from the same state, so Stripe answers both with the same session
  // (the key names the amount and the session it replaces). They used to get one each, and the
  // webhook then couldn't find the interest of the one that was paid.
  const previousSessionId = interest.stripeCheckoutSessionId;
  const checkoutSession = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: netCents,
            product_data: { name: `Collab with ${interest.creator.displayName}: "${interest.request.title}"` },
          },
          quantity: 1,
        },
        ...(vatCents > 0
          ? [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: vatCents,
                  product_data: { name: `VAT ${vatRateBp / 100} %` },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      // Names the interest so the page knows which row to wait on while the
      // webhook catches up (see CheckoutReturn).
      success_url: `${SITE_URL}/dashboard/startup/payments?checkout=success&interest=${interest.id}`,
      cancel_url: `${SITE_URL}/dashboard/startup/payments?checkout=cancelled`,
      metadata: { interestId: interest.id, ...(deal ? { dealId: deal.id } : {}) },
    },
    { idempotencyKey: `checkout-${interest.id}-${totalCents}-${previousSessionId ?? "none"}` },
  );

  const saved = await prisma.interest.updateMany({
    where: { id: interestId, paymentStatus: "ACCEPTED", stripeCheckoutSessionId: previousSessionId },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });
  if (saved.count === 0) {
    // A parallel click got the very same session (see above): nothing to undo.
    const current = await prisma.interest.findUnique({
      where: { id: interestId },
      select: { paymentStatus: true, stripeCheckoutSessionId: true },
    });
    if (current?.paymentStatus === "ACCEPTED" && current.stripeCheckoutSessionId === checkoutSession.id) {
      return { url: checkoutSession.url! };
    }
    // The offer moved on or another session was recorded: don't leave a payable session nobody records.
    await stripe.checkout.sessions.expire(checkoutSession.id).catch(() => undefined);
    return { error: "This payment changed in the meantime. Reload the page." };
  }

  return { url: checkoutSession.url! };
}

// Declines a proposal awaiting the caller's response — clears it back to
// "not paid yet" so the other side can start over with a new offer.
export async function declineOfferAction(interestId: string, expectedAmountCents: number) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");
  const role = session.user.role;
  if (role !== "STARTUP" && role !== "CREATOR") throw new Error("Not authorized.");

  const interest = await loadInterestForOfferAction(interestId, role, session.user.id);
  if (!interest) throw new Error("This offer could not be found.");
  if (interest.paymentStatus !== "OFFERED" || interest.offerRole === role) {
    throw new Error("This offer isn't awaiting your response.");
  }

  const declined = await prisma.$transaction(async (tx) => {
    const claimed = await tx.interest.updateMany({
      where: { id: interestId, paymentStatus: "OFFERED", offerRole: { not: role }, amountCents: expectedAmountCents },
      data: { paymentStatus: null, amountCents: null, platformFeeCents: null, payoutCents: null, offerRole: null, offeredAt: null },
    });
    if (claimed.count !== 1) return false;
    await settleProposal(tx, interestId, "DECLINED");
    return true;
  });
  if (!declined) throw new Error("The offer changed in the meantime. Please look at the new offer.");

  await notify(
    otherPartyUserId(interest, role),
    `${actorName(interest, role)} declined your offer for "${interest.request.title}"`,
    paymentsHref(role),
    "payments",
  );

  await revalidateOfferPaths(interest.requestId, interestId);
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
  const submitBlock = await dealBlock(interestId);
  if (submitBlock) return { error: submitBlock };
  if (interest.paymentStatus !== "HELD") {
    return { error: "This payment isn't held anymore." };
  }
  if (interest.disputedAt) {
    return { error: "A problem was reported on this collab. We're looking into it, so the link can't change right now." };
  }
  // Checked now rather than only at release: approval pays out on the spot,
  // and a brand shouldn't be approving into an account that can't receive it.
  if (!creator.stripeOnboarded || !creator.stripeAccountId) {
    return { error: "Set up payouts first. The money needs somewhere to go once it's approved." };
  }

  const resubmitted = interest.proofSubmittedAt !== null;
  await prisma.interest.update({
    where: { id: interestId },
    data: { proofUrl: parsed.data.proofUrl, proofSubmittedAt: new Date() },
  });

  await notify(
    interest.request.startup.userId,
    resubmitted
      ? `${creator.displayName} updated the link to their post for "${interest.request.title}". You have ${RELEASE_REVIEW_DAYS} days to approve it or report a problem.`
      : `${creator.displayName} posted the content for "${interest.request.title}". Approve the payment or report a problem within ${RELEASE_REVIEW_DAYS} days.`,
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
  const approveBlock = await dealBlock(interestId);
  if (approveBlock) return { error: approveBlock };
  if (interest.paymentStatus !== "HELD" || !interest.proofSubmittedAt) {
    return { error: "There's no submitted post to approve on this payment." };
  }
  if (interest.disputedAt) return { error: "You reported a problem on this payment. We'll settle it from here." };

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
  const reportBlock = await dealBlock(interestId);
  if (reportBlock) return { error: reportBlock };
  if (interest.disputedAt) return { error: "You already reported a problem. We're looking into it." };

  // Claimed like a release, so a report and the daily job (or a double
  // tap) can't both win: whichever updates the still-open payment first.
  const claimed = await prisma.interest.updateMany({
    where: { id: interestId, paymentStatus: "HELD", disputedAt: null, proofSubmittedAt: { not: null } },
    data: { disputedAt: new Date(), disputeReason: parsed.data.reason },
  });
  if (claimed.count === 0) {
    return { error: "This payment can't be put on hold anymore. It may have just been released, so refresh the page." };
  }

  const brand = interest.request.startup.companyName;
  const title = interest.request.title;
  notifyUrgent({
    key: `dispute-${interestId}`,
    title: "Streitfall: Zahlung eingefroren",
    body: formatNoticeBody([{ lines: [`${brand} meldet ein Problem mit dem Beitrag zu „${title}“ (${formatCents(interest.amountCents ?? 0)}).`, `Grund: ${parsed.data.reason.slice(0, 200)}`, "Das Geld bleibt eingefroren, bis du entscheidest."] }]),
    href: "/admin/moderation",
  });
  await notify(
    interest.creator.userId,
    `${brand} reported a problem with your post for "${title}". The payment is on hold while we look into it.`,
    "/dashboard/creator/payments",
    "payments",
  );
  const admins = await prisma.user.findMany({
    where: { OR: [{ role: "ADMIN" }, { isAdmin: true }] },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      notify(
        a.id,
        `Payment dispute: ${brand} reported a problem with ${interest.creator.displayName}'s post for "${title}" (${formatCents(interest.amountCents!)})`,
        "/admin/moderation",
        "payments",
      ),
    ),
  );

  await revalidateOfferPaths(interest.requestId);
  revalidatePath("/admin", "layout");
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
  const refundBlock = await dealBlock(interestId);
  if (refundBlock) return { error: refundBlock };

  return refundHeldPayment(interestId, "brand");
}
