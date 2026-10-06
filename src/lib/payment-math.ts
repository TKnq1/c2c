import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";

// A payment gets the Pro rate when either side of it has Pro: the brand
// paying or the creator being paid.
export function hasProRate(brand: { isPro: boolean }, creator: { isPro: boolean }): boolean {
  return brand.isPro || creator.isPro;
}

// The fee rate in percent for a payment between these two, for showing it before an offer exists.
export function feeRatePercent(brand: { isPro: boolean }, creator: { isPro: boolean }): number {
  return (hasProRate(brand, creator) ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100;
}

// The one place the fee/payout split is computed — sendOfferAction,
// bulkSendOfferAction and counterOfferAction all call this instead of each
// repeating the multiply/round/subtract, so a rate change or a rounding fix
// can't silently drift out of sync between them. `proRate`: see hasProRate.
export function splitPayment(amountCents: number, proRate: boolean): { platformFeeCents: number; payoutCents: number } {
  const platformFeeCents = Math.round(amountCents * (proRate ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE));
  const payoutCents = amountCents - platformFeeCents; // subtraction, so fee + payout always sum exactly to amount
  return { platformFeeCents, payoutCents };
}
