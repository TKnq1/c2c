import { prisma } from "@/lib/prisma";

// Writes that a paid Pro subscription started or ended, for the profile behind a Stripe customer. Called before the
// profile row is updated, so a repeated webhook (completed and async_payment_succeeded both fire) records it once.
// Founding places are left out: their Pro is not a subscription. Never throws, the webhook's real work comes first.
export async function recordProEvent(kind: "STARTED" | "ENDED", customerId: string, subscriptionId?: string) {
  try {
    const where = {
      stripeCustomerId: customerId,
      foundingNumber: null,
      ...(kind === "STARTED"
        ? { OR: [{ stripeSubscriptionId: null }, { stripeSubscriptionId: { not: subscriptionId ?? "" } }] }
        : { stripeSubscriptionId: { not: null } }),
    };
    const [brands, creators] = await Promise.all([
      prisma.startupProfile.findMany({ where, select: { id: true } }),
      prisma.creatorProfile.findMany({ where, select: { id: true } }),
    ]);
    const rows = [
      ...brands.map((p) => ({ kind, side: "STARTUP" as const, profileId: p.id })),
      ...creators.map((p) => ({ kind, side: "CREATOR" as const, profileId: p.id })),
    ];
    if (rows.length > 0) await prisma.proEvent.createMany({ data: rows });
  } catch (error) {
    console.error("Could not record Pro event", error);
  }
}
