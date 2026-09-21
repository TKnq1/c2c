import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";

// The one place the fee/payout split is computed — sendOfferAction,
// bulkSendOfferAction and counterOfferAction all call this instead of each
// repeating the multiply/round/subtract, so a rate change or a rounding fix
// can't silently drift out of sync between them.
export function splitPayment(amountCents: number, isPro: boolean): { platformFeeCents: number; payoutCents: number } {
  const platformFeeCents = Math.round(amountCents * (isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE));
  const payoutCents = amountCents - platformFeeCents; // subtraction, so fee + payout always sum exactly to amount
  return { platformFeeCents, payoutCents };
}
