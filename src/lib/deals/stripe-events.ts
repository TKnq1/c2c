import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { formatCents } from "@/lib/format";
import { alertAdmins } from "@/lib/deals/alerts";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import { openDealDispute } from "@/lib/deals/payout";
import { loadDeal, moveDeal } from "@/lib/deals/service";
import { isTerminal } from "@/lib/deals/status";

// What happens in Stripe without the app asking for it, and what the app does about it: a refund made in the Dashboard, and a
// chargeback (the brand's bank taking the payment back). They arrive through /api/webhooks/stripe, and each handler can be run
// again for the same event without doing anything twice. A person sees every one of them (alertAdmins): none of them is
// routine, and the evidence for a chargeback is only ever submitted in the Stripe Dashboard.

export type ChargeLike = { id: string; amount: number; amount_refunded: number; refunded: boolean };

export type DisputeLike = {
  id: string;
  charge: string | { id: string } | null;
  amount: number;
  reason?: string | null;
  status: string;
  evidence_details?: { due_by?: number | null } | null;
};

export type StripeEventOutcome =
  | "ignored:unknown-charge"
  | "ignored:already-refunded"
  | "ignored:duplicate"
  | "ignored:no-charge"
  | "ignored:race"
  | "alert:partial-refund"
  | "alert:after-payout"
  | "alert:not-held"
  | "alert:unknown-charge"
  | "alert:legacy"
  | "alert:not-frozen"
  | "alert:no-open-dispute"
  | "alert:other"
  | "alert:deal-moved"
  | "cancelled"
  | "frozen"
  | "joined"
  | "resumed"
  | "chargeback-lost";

const interestInclude = {
  deal: { select: { id: true, status: true } },
  request: { include: { startup: true } },
  creator: true,
} as const;

function interestForCharge(chargeId: string) {
  return prisma.interest.findFirst({ where: { stripeChargeId: chargeId }, include: interestInclude });
}

const chargeIdOf = (dispute: DisputeLike) => (typeof dispute.charge === "string" ? dispute.charge : (dispute.charge?.id ?? null));

function evidenceDue(dispute: DisputeLike): Date | null {
  const due = dispute.evidence_details?.due_by;
  return due ? new Date(due * 1000) : null;
}

const german = (date: Date) => date.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });

async function note(dealId: string, kind: string, data: Record<string, string | number | boolean | null>) {
  await prisma.dealEvent.create({ data: { dealId, kind, data } });
}

// A refund made in Stripe (the Dashboard), as opposed to the ones the app makes itself: those have marked the payment as
// refunded before Stripe says a word, so they are recognised and left alone.
export async function onChargeRefunded(charge: ChargeLike): Promise<StripeEventOutcome> {
  const interest = await interestForCharge(charge.id);
  if (!interest) return "ignored:unknown-charge";
  if (interest.paymentStatus === "REFUNDED") return "ignored:already-refunded";

  const title = interest.request.title;
  const parties = `${interest.request.startup.companyName} / ${interest.creator.displayName}`;
  const dealId = interest.deal?.id ?? null;
  const full = charge.refunded || charge.amount_refunded >= charge.amount;
  const amounts = { chargeId: charge.id, amount: charge.amount, refunded: charge.amount_refunded };

  if (!full) {
    alertAdmins({
      key: `charge-refunded-partial-${charge.id}-${charge.amount_refunded}`,
      title: "Teilerstattung in Stripe",
      lines: [
        `„${title}“ (${parties}): ${formatCents(charge.amount_refunded)} von ${formatCents(charge.amount)} wurden in Stripe erstattet.`,
        "Der Deal und die Auszahlung laufen unverändert weiter: Prüfe, ob der Betrag so gewollt war.",
      ],
    });
    if (dealId) await note(dealId, "payment.partially_refunded", amounts);
    return "alert:partial-refund";
  }

  if (interest.paymentStatus === "RELEASED") {
    alertAdmins({
      key: `charge-refunded-after-payout-${charge.id}`,
      title: "Erstattung in Stripe nach der Auszahlung",
      lines: [
        `„${title}“ (${parties}): Die Zahlung wurde vollständig erstattet, obwohl ${interest.creator.displayName} schon ausgezahlt wurde.`,
        "Der Betrag fehlt jetzt auf dem Konto von comtor. Prüfe, ob die Überweisung an den Creator zurückgeholt werden muss.",
      ],
    });
    if (dealId) await note(dealId, "payment.refunded_after_payout", amounts);
    return "alert:after-payout";
  }

  if (interest.paymentStatus !== "HELD") {
    alertAdmins({
      key: `charge-refunded-not-held-${charge.id}`,
      title: "Erstattung in Stripe zu einer Zahlung, die nicht gehalten wird",
      lines: [`„${title}“ (${parties}): Stripe meldet eine vollständige Erstattung, die Zahlung steht aber auf „${interest.paymentStatus ?? "keine"}“.`],
    });
    return "alert:not-held";
  }

  // Held and fully refunded outside the app: the money is gone, so the deal ends wherever it stood.
  const now = new Date();
  const claimed = await prisma.interest.updateMany({
    where: { id: interest.id, paymentStatus: "HELD" },
    data: { paymentStatus: "REFUNDED", refundedAt: now, disputedAt: null },
  });
  if (claimed.count === 0) return "ignored:race";

  if (interest.deal && !isTerminal(interest.deal.status)) {
    await moveDeal(interest.deal.id, "FORCE_CANCEL", "SYSTEM", {
      data: { cancelledAt: now, cancelReason: "REFUNDED_IN_STRIPE" },
      event: "refunded.outside",
      eventData: amounts,
    });
    await prisma.dealDispute.updateMany({
      where: { dealId: interest.deal.id, status: "OPEN" },
      data: { status: "RESOLVED_REFUND", resolution: "The payment was refunded in Stripe.", resolvedAt: now },
    });
    const link = dealHref(interest.deal.id);
    await notifyDealParty(interest.request.startup.userId, "refunded_outside", { title }, link);
    await notifyDealParty(interest.creator.userId, "refunded_outside", { title }, link);
  } else if (!interest.deal) {
    const message = `The payment for "${title}" was refunded to ${interest.request.startup.companyName} outside comtor.`;
    await notify(interest.creator.userId, message, "/dashboard/creator/payments", "payments");
    await notify(interest.request.startup.userId, message, "/dashboard/startup/payments", "payments");
  }
  alertAdmins({
    key: `charge-refunded-${charge.id}`,
    title: "Zahlung in Stripe erstattet",
    lines: [`„${title}“ (${parties}): ${formatCents(charge.amount_refunded)} wurden in Stripe erstattet, nicht über comtor.`, "Der Deal ist abgebrochen, der Creator wird nicht ausgezahlt."],
  });
  return "cancelled";
}

// The brand's bank opened a chargeback. While money is held, the deal and the money freeze like in any other dispute; the
// evidence has to be sent in the Stripe Dashboard before the date Stripe names.
export async function onDisputeCreated(dispute: DisputeLike): Promise<StripeEventOutcome> {
  const chargeId = chargeIdOf(dispute);
  if (!chargeId) return "ignored:no-charge";
  if (await prisma.dealDispute.findUnique({ where: { stripeDisputeId: dispute.id }, select: { id: true } })) return "ignored:duplicate";

  const due = evidenceDue(dispute);
  const facts = [
    `Stripe-Streitfall ${dispute.id}: ${formatCents(dispute.amount)}, Grund „${dispute.reason ?? "unbekannt"}“.`,
    due ? `Nachweise müssen bis ${german(due)} in Stripe eingereicht sein.` : "Die Frist für Nachweise steht in Stripe.",
  ];
  const details = `Stripe dispute ${dispute.id} (${dispute.reason ?? "unknown reason"}), ${formatCents(dispute.amount)}${due ? `, evidence due ${due.toISOString().slice(0, 10)}` : ""}`;

  const interest = await interestForCharge(chargeId);
  if (!interest) {
    alertAdmins({ key: `dispute-unknown-${dispute.id}`, title: "Stripe-Streitfall zu einer unbekannten Zahlung", lines: [...facts, `Zahlung ${chargeId} gehört zu keiner Kooperation.`] });
    return "alert:unknown-charge";
  }
  const title = interest.request.title;
  const parties = `${interest.request.startup.companyName} / ${interest.creator.displayName}`;
  const deal = interest.deal;

  if (!deal) {
    // A collab from before brand deals: the old freeze (a problem reported) is what holds the money back.
    if (interest.paymentStatus === "HELD" && !interest.disputedAt) {
      await prisma.interest.updateMany({
        where: { id: interest.id, paymentStatus: "HELD", disputedAt: null },
        data: { disputedAt: new Date(), disputeReason: `Stripe chargeback: ${details}`.slice(0, 500) },
      });
    }
    alertAdmins({ key: `dispute-created-${dispute.id}`, title: "Chargeback: Zahlung eingefroren", lines: [`„${title}“ (${parties}).`, ...facts] });
    return "alert:legacy";
  }

  if (interest.paymentStatus === "HELD" && !isTerminal(deal.status) && deal.status !== "DISPUTED") {
    const opened = await openDealDispute(deal.id, { reason: "CHARGEBACK", details, actor: "SYSTEM", stripeDisputeId: dispute.id });
    alertAdmins({
      key: `dispute-created-${dispute.id}`,
      title: opened.ok ? "Chargeback: Deal eingefroren" : "Chargeback: Deal konnte nicht eingefroren werden",
      lines: [`„${title}“ (${parties}).`, ...facts, opened.ok ? "Das Geld bleibt eingefroren, bis Stripe entschieden hat." : "Prüfe den Deal von Hand: Er lässt sich in diesem Stand nicht einfrieren."],
    });
    return opened.ok ? "frozen" : "alert:not-frozen";
  }

  if (deal.status === "DISPUTED") {
    // A person had already frozen it: the chargeback joins that dispute, so the decision is made once.
    const open = await prisma.dealDispute.findFirst({ where: { dealId: deal.id, status: "OPEN", stripeDisputeId: null }, orderBy: { openedAt: "asc" } });
    if (open) {
      await prisma.dealDispute.update({
        where: { id: open.id },
        data: { stripeDisputeId: dispute.id, details: `${open.details ? `${open.details}\n` : ""}${details}`.slice(0, 1000) },
      });
    }
    alertAdmins({ key: `dispute-created-${dispute.id}`, title: "Chargeback zu einem Deal im Streit", lines: [`„${title}“ (${parties}).`, ...facts] });
    return "joined";
  }

  // Paid out or ended: there is nothing left to freeze, and the amount comes out of comtor's own balance.
  await note(deal.id, "payment.chargeback_opened", { disputeId: dispute.id, amount: dispute.amount });
  alertAdmins({
    key: `dispute-created-${dispute.id}`,
    title: "Chargeback nach der Auszahlung",
    lines: [`„${title}“ (${parties}) ist ${deal.status === "COMPLETED" ? "abgeschlossen und ausgezahlt" : "beendet"}.`, ...facts, "Der Betrag wird von comtors Stripe-Guthaben abgezogen, falls der Streitfall verloren geht."],
  });
  return "alert:after-payout";
}

// Stripe decided. Won: the deal carries on where it stood. Lost: the money is gone, the deal ends and nobody is paid out.
export async function onDisputeClosed(dispute: DisputeLike): Promise<StripeEventOutcome> {
  const chargeId = chargeIdOf(dispute);
  const outcome = dispute.status;
  alertAdmins({
    key: `dispute-closed-${dispute.id}`,
    title: `Stripe-Streitfall abgeschlossen: ${outcome === "won" ? "gewonnen" : outcome === "lost" ? "verloren" : outcome}`,
    lines: [`Stripe-Streitfall ${dispute.id}: ${formatCents(dispute.amount)}, Ergebnis „${outcome}“.`],
  });

  const record = await prisma.dealDispute.findUnique({ where: { stripeDisputeId: dispute.id } });
  const interest = chargeId ? await interestForCharge(chargeId) : null;

  if (!record) {
    // A collab from before deals: the old freeze is lifted, or the payment written off.
    if (interest && !interest.deal) {
      if (outcome === "lost") {
        await prisma.interest.updateMany({ where: { id: interest.id, paymentStatus: "HELD" }, data: { paymentStatus: "REFUNDED", refundedAt: new Date(), disputedAt: null } });
        return "chargeback-lost";
      }
      if (outcome === "won" || outcome === "warning_closed") {
        await prisma.interest.updateMany({ where: { id: interest.id, disputeReason: { startsWith: "Stripe chargeback" } }, data: { disputedAt: null, disputeReason: null } });
        return "resumed";
      }
    }
    return "alert:no-open-dispute";
  }
  if (record.status !== "OPEN") return "ignored:duplicate";

  const view = await loadDeal(record.dealId);
  if (!view || view.deal.status !== "DISPUTED") return "alert:deal-moved";
  const now = new Date();
  const link = dealHref(view.deal.id);

  if (outcome === "won" || outcome === "warning_closed") {
    const moved = await moveDeal(view.deal.id, "RESOLVE_RESUME", "SYSTEM", { event: "dispute.chargeback_won", data: { graceUntil: null } });
    if (!moved.ok) return "alert:deal-moved";
    await prisma.interest.updateMany({ where: { id: view.deal.interestId }, data: { disputedAt: null, disputeReason: null } });
    await prisma.dealDispute.update({ where: { id: record.id }, data: { status: "RESOLVED_RESUME", resolution: `Stripe: ${outcome}.`, resolvedAt: now } });
    await notifyDealParty(view.brandUserId, "dispute_resumed", { title: view.title }, link);
    await notifyDealParty(view.creatorUserId, "dispute_resumed", { title: view.title }, link);
    return "resumed";
  }

  if (outcome === "lost") {
    await prisma.interest.updateMany({
      where: { id: view.deal.interestId, paymentStatus: "HELD" },
      data: { paymentStatus: "REFUNDED", refundedAt: now, disputedAt: null },
    });
    const moved = await moveDeal(view.deal.id, "RESOLVE_REFUND", "SYSTEM", {
      data: { cancelledAt: now, cancelReason: "CHARGEBACK_LOST" },
      event: "dispute.chargeback_lost",
    });
    if (!moved.ok) return "alert:deal-moved";
    await prisma.dealDispute.update({ where: { id: record.id }, data: { status: "RESOLVED_REFUND", resolution: "Stripe: the chargeback was lost.", resolvedAt: now } });
    await notifyDealParty(view.brandUserId, "chargeback_lost", { title: view.title }, link);
    await notifyDealParty(view.creatorUserId, "chargeback_lost", { title: view.title }, link);
    return "chargeback-lost";
  }

  return "alert:other";
}
