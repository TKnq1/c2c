"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { canSellProSubscription } from "@/lib/native-app-server";
import { canWithdrawPro } from "@/lib/pro-withdrawal";

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
  // Mirrors the hidden upgrade UI in the store apps, see canSellProSubscription.
  if (!(await canSellProSubscription())) return { error: "Pro isn't available in the app." };

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

// Within 14 days of the first charge the brand can end Pro and get that
// payment back. Ordinary cancellation (above) does not refund.
export async function withdrawProAction(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") return { error: "Not authorized." };

  const startup = await prisma.startupProfile.findUnique({ where: { userId: session.user.id } });
  if (!startup?.isPro || !startup.stripeSubscriptionId || !startup.proSince) {
    return { error: "Pro can't be withdrawn right now." };
  }
  if (!canWithdrawPro(startup.proSince)) {
    return { error: "The 14 days to withdraw have passed. You can still cancel Pro." };
  }

  try {
    const refund = await refundLatestProPayment(startup.stripeSubscriptionId, startup.id);
    if (!refund) return { error: "No payment to refund." };
    await stripe.subscriptions.cancel(startup.stripeSubscriptionId);
    await prisma.$transaction([
      prisma.startupProfile.update({
        where: { id: startup.id },
        data: { isPro: false, stripeSubscriptionId: null },
      }),
      prisma.proWithdrawal.create({
        data: { startupId: startup.id, amountCents: refund.amount, stripeRefundId: refund.id },
      }),
    ]);
  } catch (err) {
    console.error("Pro withdrawal failed:", err);
    return { error: "The withdrawal didn't go through. Try again, or write to info@comtor.app." };
  }

  revalidateSubscriptionPaths();
  revalidatePath("/admin/payments");
  return {};
}

async function refundLatestProPayment(subscriptionId: string, startupId: string) {
  const invoices = await stripe.invoices.list({ subscription: subscriptionId, status: "paid", limit: 1 });
  const invoice = invoices.data[0];
  if (!invoice) return null;
  const key = `pro-withdraw-${startupId}-${invoice.id}`;
  const legacyCharge = (invoice as { charge?: string | null }).charge;
  if (typeof legacyCharge === "string") return stripe.refunds.create({ charge: legacyCharge }, { idempotencyKey: key });

  const listed = await stripe.invoicePayments.list({ invoice: invoice.id, limit: 5 });
  const paid = listed.data.find((item) => item.status === "paid") ?? listed.data[0];
  const intent = paid?.payment.payment_intent;
  const charge = paid?.payment.charge;
  const intentId = typeof intent === "string" ? intent : intent?.id;
  if (intentId) return stripe.refunds.create({ payment_intent: intentId }, { idempotencyKey: key });
  const chargeId = typeof charge === "string" ? charge : charge?.id;
  if (chargeId) return stripe.refunds.create({ charge: chargeId }, { idempotencyKey: key });
  return null;
}
