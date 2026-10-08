import type { DisputeReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { notify } from "@/lib/notifications";
import { notifyUrgent } from "@/lib/admin-digest";
import { formatNoticeBody } from "@/lib/admin-notice-format";
import { formatCents } from "@/lib/format";
import { issueDealInvoices } from "@/lib/billing/issue";
import { refundHeldPayment, releaseHeldPayment, type MoneyMoveResult } from "@/lib/payment-release";
import { DAY_MS, DEAL_POLICY, type CancelReason } from "@/lib/deals/policy";
import { cancelReasonText } from "@/lib/deals/notices";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import { claimReminder, loadDeal, moveDeal, type DealView } from "@/lib/deals/service";
import { dealLocale } from "@/lib/deals/copy";
import { verifyDealPosts } from "@/lib/deals/verification";
import type { Actor } from "@/lib/deals/status";

// Everything that moves the money of a deal, or stops it moving: the payout after the hold window, cancellation with a
// refund, disputes and their settlement. The Stripe side lives in payment-release.ts; this decides when it may run.

async function notifyAdmins(message: string, href: string) {
  const admins = await prisma.user.findMany({ where: { OR: [{ role: "ADMIN" }, { isAdmin: true }] }, select: { id: true } });
  await Promise.all(admins.map((a) => notify(a.id, message, href, "payments")));
}

// The payout, once the deal is in PAYOUT_PENDING. Called after the hold window, by the daily retry, and after an admin
// settled a dispute for the creator. The deal only completes once Stripe has really moved the money.
export async function releaseDealPayout(dealId: string, trigger: "verified" | "admin" = "verified"): Promise<MoneyMoveResult> {
  const view = await loadDeal(dealId);
  if (!view || view.deal.status !== "PAYOUT_PENDING") return { error: "This deal isn't waiting for its payout." };

  // A previous run may have moved the money and been cut off before it completed the deal: then only the rest is left.
  const alreadyReleased = view.deal.interest.paymentStatus === "RELEASED";
  const result: MoneyMoveResult = alreadyReleased ? {} : await releaseHeldPayment(view.deal.interestId, trigger, { notifyParties: false });
  if (result.error) {
    if (/payouts/i.test(result.error) && (await claimReminder(dealId, "payout_blocked"))) {
      await notifyDealParty(
        view.creatorUserId,
        "payout_blocked",
        { title: view.title, payout: formatCents(view.deal.interest.payoutCents ?? view.terms.payoutCents) },
        "/dashboard/creator/payments",
      );
    }
    return result;
  }

  const now = new Date();
  const moved = await moveDeal(dealId, "PAYOUT_RELEASED", trigger === "admin" ? "ADMIN" : "SYSTEM", {
    expectedFrom: "PAYOUT_PENDING",
    data: { completedAt: now },
  });
  if (!moved.ok) return {};

  await notifyDealParty(view.creatorUserId, "payout_released_creator", { title: view.title, payout: formatCents(view.deal.interest.payoutCents ?? view.terms.payoutCents) }, dealHref(dealId));
  await notifyDealParty(view.brandUserId, "payout_released_brand", { title: view.title, creator: view.creatorName }, dealHref(dealId));

  try {
    const issued = await issueDealInvoices(dealId, now);
    if (issued.skipped === "NO_ISSUER") {
      notifyUrgent({
        key: `invoice-data-${dealId}`,
        title: "Rechnung konnte nicht erstellt werden",
        body: formatNoticeBody([{ lines: [`Für den Deal „${view.title}“ fehlen die Steuerdaten von comtor (IMPRINT_VAT_ID oder PLATFORM_TAX_NUMBER).`, "Die Rechnungen werden nachgeholt, sobald die Daten hinterlegt sind."] }]),
        href: "/admin/deals",
      });
    }
  } catch (err) {
    console.error("Issuing the invoices failed", { dealId, err });
  }
  return {};
}

// A checkout that may still be paid must not outlive the deal it was for.
async function closeOpenCheckout(sessionId: string | null): Promise<{ ok: true } | { ok: false }> {
  if (!sessionId) return { ok: true };
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status === "complete") return { ok: false };
    if (session.status === "open") await stripe.checkout.sessions.expire(sessionId);
    return { ok: true };
  } catch {
    // Stripe unreachable: better not to cancel than to cancel with a payment possibly on its way.
    return { ok: false };
  }
}

export type CancelResult = { ok: true } | { ok: false; error: string };

// Ends a deal that will not happen. If the escrow was funded the brand is refunded (the creator never got anything);
// if not, the offer goes back to "nothing agreed" so the two can start over.
export async function cancelDeal(dealId: string, reason: CancelReason, actor: Actor, actorUserId?: string): Promise<CancelResult> {
  const view = await loadDeal(dealId);
  if (!view) return { ok: false, error: "NOT_FOUND" };
  const { interest } = view.deal;

  if (interest.paymentStatus === "HELD") {
    const trigger = actor === "CREATOR" ? "creator" : actor === "SYSTEM" ? "deadline" : actor === "ADMIN" ? "admin" : "brand";
    const refund = await refundHeldPayment(interest.id, trigger, { notifyParties: false });
    if (refund.error) return { ok: false, error: refund.error };
  } else if (interest.paymentStatus === "ACCEPTED") {
    const closed = await closeOpenCheckout(interest.stripeCheckoutSessionId);
    if (!closed.ok) return { ok: false, error: "A payment for this deal is still going through. Try again in a few minutes." };
    await prisma.interest.updateMany({
      where: { id: interest.id, paymentStatus: "ACCEPTED" },
      data: { paymentStatus: null, amountCents: null, platformFeeCents: null, payoutCents: null, offerRole: null, offeredAt: null, acceptedAt: null, stripeCheckoutSessionId: null },
    });
  } else {
    return { ok: false, error: "There is nothing to cancel on this deal." };
  }

  const moved = await moveDeal(dealId, "CANCEL", actor, {
    actorUserId,
    data: { cancelledAt: new Date(), cancelReason: reason },
    event: `cancelled.${reason}`,
  });
  if (!moved.ok) return { ok: false, error: "The deal changed in the meantime." };

  const funded = interest.paymentStatus === "HELD";
  await notifyCancellation(view, reason, funded, actor);
  return { ok: true };
}

async function notifyCancellation(view: DealView, reason: CancelReason, refunded: boolean, actor: Actor) {
  const link = dealHref(view.deal.id);
  const reasonFor = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
    return cancelReasonText(reason, dealLocale(user?.locale ?? "de"));
  };
  if (actor === "CREATOR") {
    await notifyDealParty(view.brandUserId, refunded ? "deal_cancelled_brand" : "deal_cancelled_creator", { title: view.title, creator: view.creatorName, reason: await reasonFor(view.brandUserId) }, link);
    return;
  }
  if (actor === "STARTUP") {
    await notifyDealParty(view.creatorUserId, "deal_cancelled_by_brand", { title: view.title, brand: view.brandName }, link);
    return;
  }
  await notifyDealParty(view.brandUserId, refunded ? "deal_cancelled_refund_brand" : "deal_cancelled_creator", { title: view.title, reason: await reasonFor(view.brandUserId) }, link);
  await notifyDealParty(view.creatorUserId, "deal_cancelled_creator", { title: view.title, reason: await reasonFor(view.creatorUserId) }, link);
}

const DISPUTE_REASON_TEXT: Record<DisputeReason, { de: string; en: string }> = {
  MISSED_DEADLINE: { de: "Frist verpasst", en: "missed deadline" },
  DRAFT_REJECTED: { de: "Entwurf abgelehnt", en: "draft rejected" },
  POST_REMOVED: { de: "Post entfernt", en: "post removed" },
  DISCLOSURE_MISSING: { de: "Werbekennzeichnung fehlt", en: "advertising label missing" },
  CONTENT_MISMATCH: { de: "Inhalt entspricht nicht dem Briefing", en: "content does not match the briefing" },
  USAGE_RIGHTS_MISSING: { de: "Nutzungsrechte nicht übergeben", en: "usage rights not handed over" },
  OTHER: { de: "Sonstiges", en: "other" },
};

export function disputeReasonText(reason: DisputeReason, locale: "de" | "en"): string {
  return DISPUTE_REASON_TEXT[reason][locale];
}

export type DisputeOpenResult = { ok: true; disputeId: string } | { ok: false; error: string };

// Freezes the deal and the money until an admin decides. Opened by a party, or by the system when a deadline or a
// removed post makes it necessary.
export async function openDealDispute(
  dealId: string,
  input: { reason: DisputeReason; details: string | null; actor: "STARTUP" | "CREATOR" | "SYSTEM"; actorUserId?: string },
): Promise<DisputeOpenResult> {
  const view = await loadDeal(dealId);
  if (!view) return { ok: false, error: "NOT_FOUND" };

  const moved = await moveDeal(dealId, "OPEN_DISPUTE", input.actor, {
    actorUserId: input.actorUserId,
    event: "dispute.opened",
    eventData: { reason: input.reason },
  });
  if (!moved.ok) return { ok: false, error: moved.reason };

  const dispute = await prisma.dealDispute.create({
    data: {
      dealId,
      reason: input.reason,
      details: input.details?.slice(0, 1000) ?? null,
      openedByRole: input.actor === "SYSTEM" ? null : input.actor,
      openedByUserId: input.actorUserId ?? null,
    },
  });
  // The legacy release paths look at this: nothing pays out or refunds around an open dispute.
  await prisma.interest.updateMany({
    where: { id: view.deal.interestId, paymentStatus: "HELD" },
    data: { disputedAt: new Date(), disputeReason: `${input.reason}${input.details ? `: ${input.details.slice(0, 200)}` : ""}` },
  });

  const who = input.actor === "STARTUP" ? view.brandName : input.actor === "CREATOR" ? view.creatorName : "comtor";
  const link = dealHref(dealId);
  for (const userId of [view.brandUserId, view.creatorUserId]) {
    if (userId === input.actorUserId) continue;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
    await notifyDealParty(userId, "dispute_opened", { title: view.title, who, reason: disputeReasonText(input.reason, dealLocale(user?.locale ?? "de")) }, link);
  }
  await notifyAdmins(`Deal-Streitfall: ${view.title} (${disputeReasonText(input.reason, "de")}, ${formatCents(view.terms.amountCents)})`, "/admin/deals");
  notifyUrgent({
    key: `deal-dispute-${dispute.id}`,
    title: "Streitfall: Deal eingefroren",
    body: formatNoticeBody([{ lines: [`„${view.title}“ (${view.brandName} / ${view.creatorName}), ${formatCents(view.terms.amountCents)}.`, `Grund: ${disputeReasonText(input.reason, "de")}${input.details ? ` – ${input.details.slice(0, 200)}` : ""}`, "Das Geld bleibt eingefroren, bis du entscheidest."] }]),
    href: "/admin/deals",
  });
  return { ok: true, disputeId: dispute.id };
}

export type DisputeResolution = "RELEASE" | "REFUND" | "RESUME";

// The admin's decision. RELEASE pays the creator, REFUND pays the brand back, RESUME lets the deal carry on where it
// stood (a dispute that turned out to be a misunderstanding). The caller has checked the admin and their password.
export async function resolveDealDispute(
  disputeId: string,
  adminId: string,
  resolution: DisputeResolution,
  note: string,
): Promise<MoneyMoveResult> {
  const dispute = await prisma.dealDispute.findUnique({ where: { id: disputeId } });
  if (!dispute || dispute.status !== "OPEN") return { error: "This dispute is already settled." };
  const view = await loadDeal(dispute.dealId);
  if (!view || view.deal.status !== "DISPUTED") return { error: "This deal isn't frozen anymore." };
  const dealId = view.deal.id;
  const interestId = view.deal.interestId;
  const link = dealHref(dealId);

  const settle = (status: "RESOLVED_RELEASE" | "RESOLVED_REFUND" | "RESOLVED_RESUME") =>
    prisma.dealDispute.update({ where: { id: disputeId }, data: { status, resolution: note.slice(0, 1000), resolvedByAdminId: adminId, resolvedAt: new Date() } });

  if (resolution === "REFUND") {
    const refund = await refundHeldPayment(interestId, "admin", { notifyParties: false });
    if (refund.error) return refund;
    await moveDeal(dealId, "RESOLVE_REFUND", "ADMIN", { actorUserId: adminId, data: { cancelledAt: new Date(), cancelReason: "DISPUTE_REFUND" }, event: "dispute.refunded" });
    await settle("RESOLVED_REFUND");
    await notifyDealParty(view.brandUserId, "dispute_refunded", { title: view.title, brand: view.brandName }, link);
    await notifyDealParty(view.creatorUserId, "dispute_refunded", { title: view.title, brand: view.brandName }, link);
    return {};
  }

  // Both other outcomes lift the freeze on the money first.
  await prisma.interest.updateMany({ where: { id: interestId }, data: { disputedAt: null, disputeReason: null } });

  if (resolution === "RESUME") {
    const moved = await moveDeal(dealId, "RESOLVE_RESUME", "ADMIN", { actorUserId: adminId, event: "dispute.resumed", data: { graceUntil: null } });
    if (!moved.ok) return { error: "The deal can't continue from where it stood." };
    await settle("RESOLVED_RESUME");
    await notifyDealParty(view.brandUserId, "dispute_resumed", { title: view.title }, link);
    await notifyDealParty(view.creatorUserId, "dispute_resumed", { title: view.title }, link);
    return {};
  }

  const moved = await moveDeal(dealId, "RESOLVE_RELEASE", "ADMIN", { actorUserId: adminId, event: "dispute.released", data: { payoutEligibleAt: new Date() } });
  if (!moved.ok) return { error: "The payout can't be released from this stage." };
  await settle("RESOLVED_RELEASE");
  await notifyDealParty(view.brandUserId, "dispute_released", { title: view.title, creator: view.creatorName }, link);
  await notifyDealParty(view.creatorUserId, "dispute_released", { title: view.title, creator: view.creatorName }, link);
  // The deal now waits for its payout; if Stripe says no (payouts not set up) the daily job retries.
  const released = await releaseDealPayout(dealId, "admin");
  return released;
}

const USAGE_DELIVERY_GRACE_MS = DEAL_POLICY.usageDeliveryGraceDays * DAY_MS;

// The hold window is over. One last look at the posts, then the payout, unless something still stands in the way.
export async function finishVerificationWindow(dealId: string, now = new Date()): Promise<void> {
  await verifyDealPosts(dealId, now);
  const view = await loadDeal(dealId);
  if (!view || view.deal.status !== "VERIFYING") return;
  const endsAt = view.deal.verificationEndsAt;
  if (!endsAt || now.getTime() < endsAt.getTime()) return;

  // Paid ad rights are part of what was bought: they have to be handed over before the money is.
  if (view.terms.usage.type === "PAID_ADS" && !view.deal.usageDeliveredAt) {
    if (await claimReminder(dealId, "usage_delivery")) {
      await notifyDealParty(view.creatorUserId, "usage_delivery_needed", { title: view.title }, dealHref(dealId));
    }
    if (now.getTime() >= endsAt.getTime() + USAGE_DELIVERY_GRACE_MS) {
      await openDealDispute(dealId, { reason: "USAGE_RIGHTS_MISSING", details: null, actor: "SYSTEM" });
    }
    return;
  }

  const moved = await moveDeal(dealId, "WINDOW_ELAPSED", "SYSTEM", { expectedFrom: "VERIFYING", data: { payoutEligibleAt: now } });
  if (!moved.ok) return;
  await releaseDealPayout(dealId);
}
