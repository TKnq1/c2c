import type { PaymentStatus } from "@prisma/client";
import { proSplitIfCheaper } from "@/lib/payment-math";
import { prisma } from "@/lib/prisma";

// A deal's fee and payout are fixed when its offer is made (see splitPayment), so a deal offered before one side
// got Pro (the founding creators, or a brand that has subscribed since) still carries the standard fee. Until the
// money is released that can move to the Pro fee: the amount the brand pays stays, only the platform's cut shrinks.
const OPEN_STATUSES: PaymentStatus[] = ["OFFERED", "ACCEPTED", "HELD"];

export type DealToReprice = {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  from: { platformFeeCents: number; payoutCents: number };
  to: { platformFeeCents: number; payoutCents: number };
};

export async function dealsToReprice(): Promise<DealToReprice[]> {
  const deals = await prisma.interest.findMany({
    where: {
      paymentStatus: { in: OPEN_STATUSES },
      amountCents: { not: null },
      platformFeeCents: { not: null },
      OR: [{ creator: { isPro: true } }, { request: { startup: { isPro: true } } }],
    },
    select: { id: true, paymentStatus: true, amountCents: true, platformFeeCents: true, payoutCents: true },
  });
  return deals.flatMap((deal) => {
    const to = proSplitIfCheaper(deal.amountCents, deal.platformFeeCents);
    if (!to) return [];
    return [
      {
        id: deal.id,
        status: deal.paymentStatus!,
        amountCents: deal.amountCents!,
        from: { platformFeeCents: deal.platformFeeCents!, payoutCents: deal.payoutCents! },
        to,
      },
    ];
  });
}

// What the creators gain in total, for the confirmation text.
export function totalGainCents(deals: DealToReprice[]): number {
  return deals.reduce((sum, deal) => sum + (deal.to.payoutCents - deal.from.payoutCents), 0);
}

// Each deal is changed only if it is still exactly as read: a counter-offer, a release or a refund in the meantime
// makes the update match nothing, and that deal is skipped (pressing the button again picks it up if it still applies).
export async function repriceOpenDeals(): Promise<{ updated: number; skipped: number; gainCents: number }> {
  const deals = await dealsToReprice();
  let updated = 0;
  let gainCents = 0;
  for (const deal of deals) {
    const result = await prisma.interest.updateMany({
      where: {
        id: deal.id,
        paymentStatus: { in: OPEN_STATUSES },
        amountCents: deal.amountCents,
        platformFeeCents: deal.from.platformFeeCents,
        payoutCents: deal.from.payoutCents,
      },
      data: { platformFeeCents: deal.to.platformFeeCents, payoutCents: deal.to.payoutCents },
    });
    if (result.count === 1) {
      updated += 1;
      gainCents += deal.to.payoutCents - deal.from.payoutCents;
    }
  }
  return { updated, skipped: deals.length - updated, gainCents };
}
