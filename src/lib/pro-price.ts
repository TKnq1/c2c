import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_PRICE_CENTS } from "@/lib/constants";
import type { FoundingSide } from "@/lib/founding-limits";

// What Pro costs a new subscriber on each side, and from what monthly volume it pays for itself. Client-safe.

export function proPriceCents(side: FoundingSide): number {
  return PRO_PRICE_CENTS[side];
}

// The monthly payment volume at which the fee Pro saves equals its price.
export function proBreakEvenCents(priceCents: number): number {
  return Math.round(priceCents / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE));
}

// The Stripe price a new subscription on this side is sold at (server only: read from the environment).
export function proStripePriceId(side: FoundingSide, env: Record<string, string | undefined> = process.env): string | undefined {
  return (side === "brand" ? env.STRIPE_PRO_BRAND_PRICE_ID : env.STRIPE_PRO_CREATOR_PRICE_ID) || undefined;
}
