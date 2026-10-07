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

// The split a deal that is still on the standard fee moves to once a side has Pro, or null when it already
// has the Pro fee (or lower). A fee is never raised: the amount the brand pays stays, only the platform's cut shrinks.
export function proSplitIfCheaper(
  amountCents: number | null,
  platformFeeCents: number | null,
): { platformFeeCents: number; payoutCents: number } | null {
  if (amountCents === null || platformFeeCents === null) return null;
  const pro = splitPayment(amountCents, true);
  return pro.platformFeeCents < platformFeeCents ? pro : null;
}
