"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

function revalidateSubscriptionPaths() {
  revalidatePath("/dashboard/startup/settings");
  revalidatePath("/dashboard/startup/payments");
}

// Starts a real Stripe Checkout Session for the Pro subscription —
// mode: "subscription" instead of the one-time "payment" mode used for
// collab payments (see payments.ts), but the same redirect-based Checkout
// pattern rather than an embedded flow just for this one form. isPro only
// flips on once the webhook confirms the subscription actually exists
// (checkout.session.completed / customer.subscription.updated), not at
// the moment this link is generated.
export async function createProCheckoutSessionAction(): Promise<{ url: string } | { error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  if (startup.isPro) return { error: "You're already on Pro." };

  let customerId = startup.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: startup.companyName,
      metadata: { startupId: startup.id },
    });
    customerId = customer.id;
    await prisma.startupProfile.update({ where: { id: startup.id }, data: { stripeCustomerId: customerId } });
  }

  // Do NOT pass payment_method_types here — Stripe determines eligible
  // methods dynamically from Dashboard settings (see
  // .agents/skills/stripe-best-practices/references/billing.md).
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${SITE_URL}/dashboard/startup/settings#plan`,
    cancel_url: `${SITE_URL}/dashboard/startup/settings#plan`,
  });

  return { url: checkoutSession.url! };
}

// Cancels immediately rather than at period end — simpler and consistent
// with how this worked before Stripe was wired in (an instant toggle back
// to the standard rate), at the cost of not prorating/refunding the
// remainder of the current billing period.
export async function cancelProAction() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  if (!startup.stripeSubscriptionId) throw new Error("No active subscription found.");

  await stripe.subscriptions.cancel(startup.stripeSubscriptionId);
  // The customer.subscription.deleted webhook will also flip isPro false,
  // but updating it here too means the UI reflects it immediately instead
  // of waiting on webhook delivery.
  await prisma.startupProfile.update({
    where: { id: startup.id },
    data: { isPro: false, stripeSubscriptionId: null },
  });

  revalidateSubscriptionPaths();
}
