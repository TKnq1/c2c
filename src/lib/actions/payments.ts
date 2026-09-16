"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOfferSchema, releasePaymentSchema } from "@/lib/validation";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";
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
  const platformFeeCents = Math.round(amountCents * (startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE));
  const payoutCents = amountCents - platformFeeCents; // subtraction, so fee + payout always sum exactly to amount

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
  const platformFeeCents = Math.round(amountCents * (startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE));
  const payoutCents = amountCents - platformFeeCents;

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
  const platformFeeCents = Math.round(
    amountCents * (interest.request.startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE),
  );
  const payoutCents = amountCents - platformFeeCents;

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
  await prisma.interest.update({
    where: { id: interestId },
    data: { paymentStatus: "HELD", paidAt: new Date() },
  });

  await notify(
    otherPartyUserId(interest, role),
    `${actorName(interest, role)} accepted your offer of ${formatCents(interest.amountCents!)} for "${interest.request.title}" — funds are now held in escrow`,
    paymentsHref(role),
    "payments",
  );

  await revalidateOfferPaths(interest.requestId);
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

  await prisma.interest.update({
    where: { id: interestId },
    data: { paymentStatus: "RELEASED", releasedAt: new Date(), proofUrl: parsed.data.proofUrl || null },
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

  await prisma.interest.update({
    where: { id: interestId },
    data: { paymentStatus: "REFUNDED", refundedAt: new Date() },
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
