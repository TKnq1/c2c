import { prisma } from "@/lib/prisma";

// What the running Pro subscriptions bring in a month: each at the price it was sold at (proPriceCents, set from Stripe),
// so subscriptions from before a price change count at their own price. Founding places without a subscription pay nothing.
export async function proMrrCents(): Promise<number> {
  const paying = { isPro: true, stripeSubscriptionId: { not: null } };
  const [brands, creators] = await Promise.all([
    prisma.startupProfile.aggregate({ where: paying, _sum: { proPriceCents: true } }),
    prisma.creatorProfile.aggregate({ where: paying, _sum: { proPriceCents: true } }),
  ]);
  return (brands._sum.proPriceCents ?? 0) + (creators._sum.proPriceCents ?? 0);
}
