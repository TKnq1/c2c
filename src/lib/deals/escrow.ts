import { computeDeadlines } from "@/lib/deals/deadlines";
import { formatCents } from "@/lib/format";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import { loadDeal, moveDeal } from "@/lib/deals/service";

// The money is in escrow (the Stripe webhook saw the payment): the creator is on the clock from now. Safe to call twice.
export async function onEscrowFunded(dealId: string, now = new Date()): Promise<void> {
  const view = await loadDeal(dealId);
  if (!view || view.deal.status !== "AWAITING_ESCROW") return;

  const deadlines = computeDeadlines(view.terms, now);
  const moved = await moveDeal(dealId, "FUND_ESCROW", "SYSTEM", {
    expectedFrom: "AWAITING_ESCROW",
    data: {
      fundedAt: now,
      postWindowStart: deadlines.postWindowStart,
      postWindowEnd: deadlines.postWindowEnd,
      draftDueAt: deadlines.draftDueAt,
    },
  });
  if (!moved.ok) return;

  const draft = deadlines.draftDueAt;
  await notifyDealParty(
    view.creatorUserId,
    draft ? "escrow_funded_draft" : "escrow_funded_direct",
    { brand: view.brandName, title: view.title, amount: formatCents(view.terms.amountCents), date: draft ?? deadlines.postWindowEnd },
    dealHref(dealId),
  );
}
