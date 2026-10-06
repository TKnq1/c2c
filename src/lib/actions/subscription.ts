"use server";

import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { canSellProSubscription } from "@/lib/native-app-server";
import { canWithdrawPro } from "@/lib/pro-withdrawal";
import { findProProfile, planPath, updateProProfile } from "@/lib/pro-profile";

// Stripe Tax on the Pro plan, off unless STRIPE_AUTOMATIC_TAX=1. It needs the head office address and an active
// registration in Stripe (Tax → Locations) first; without one Stripe collects nothing and the customer only gets an
// extra address form. The Price is tax-inclusive, so the total stays at the advertised price.
function proTaxParams(): Partial<Stripe.Checkout.SessionCreateParams> {
  if (process.env.STRIPE_AUTOMATIC_TAX !== "1") return {};
  return {
    automatic_tax: { enabled: true },
    // The customer is created without an address: Checkout asks for it and saves it on the customer, so every
    // renewal is taxed at the same place. Businesses can add their VAT ID (reverse charge across EU borders).
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
    tax_id_collection: { enabled: true },
  };
}

function revalidateSubscriptionPaths() {
  revalidatePath("/dashboard/startup/settings");
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/settings");
  revalidatePath("/dashboard/creator/payments");
}

// Starts a real Stripe Checkout Session for the Pro subscription, for a brand
// or a creator —
// mode: "subscription" instead of the one-time "payment" mode used for
// collab payments (see payments.ts), but the same redirect-based Checkout
// pattern rather than an embedded flow just for this one form. isPro only
// flips on once the webhook confirms the subscription actually exists
// (checkout.session.completed / customer.subscription.updated), not at
// the moment this link is generated.
export async function createProCheckoutSessionAction(): Promise<{ url: string } | { error: string }> {
  const session = await auth();
  const profile = session ? await findProProfile(session.user.id, session.user.role) : null;
  if (!session || !profile) return { error: "Not authorized." };
  // Mirrors the hidden upgrade UI in the store apps, see canSellProSubscription.
  if (!(await canSellProSubscription())) return { error: "Pro isn't available in the app." };
  if (profile.isPro) return { error: "You're already on Pro." };

  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: profile.name || undefined,
      metadata: profile.side === "brand" ? { startupId: profile.id } : { creatorId: profile.id },
    });
    customerId = customer.id;
    await updateProProfile(profile, { stripeCustomerId: customerId });
  }

  // Do NOT pass payment_method_types here — Stripe determines eligible
  // methods dynamically from Dashboard settings (see
  // .agents/skills/stripe-best-practices/references/billing.md).
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    ...proTaxParams(),
    success_url: `${SITE_URL}${planPath(profile.side)}`,
    cancel_url: `${SITE_URL}${planPath(profile.side)}`,
  });

  return { url: checkoutSession.url! };
}

// Cancels immediately rather than at period end — simpler and consistent
// with how this worked before Stripe was wired in (an instant toggle back
// to the standard rate), at the cost of not prorating/refunding the
// remainder of the current billing period.
export async function cancelProAction() {
  const session = await auth();
  const profile = session ? await findProProfile(session.user.id, session.user.role) : null;
  if (!profile) throw new Error("Not authorized.");
  if (!profile.stripeSubscriptionId) throw new Error("No active subscription found.");

  await stripe.subscriptions.cancel(profile.stripeSubscriptionId);
  // The customer.subscription.deleted webhook will also flip isPro false,
  // but updating it here too means the UI reflects it immediately instead
  // of waiting on webhook delivery. A founding place's Pro doesn't depend on the subscription.
  await updateProProfile(profile, { isPro: profile.foundingNumber !== null, stripeSubscriptionId: null });

  revalidateSubscriptionPaths();
}

// Within 14 days of the first charge a brand or a creator can end Pro and get
// that payment back. Ordinary cancellation (above) does not refund.
export async function withdrawProAction(): Promise<{ error?: string }> {
  const session = await auth();
  const profile = session ? await findProProfile(session.user.id, session.user.role) : null;
  if (!profile) return { error: "Not authorized." };

  if (!profile.isPro || !profile.stripeSubscriptionId || !profile.proSince) {
    return { error: "Pro can't be withdrawn right now." };
  }
  if (!canWithdrawPro(profile.proSince)) {
    return { error: "The 14 days to withdraw have passed. You can still cancel Pro." };
  }

  try {
    const refund = await refundLatestProPayment(profile.stripeSubscriptionId, profile.id);
    if (!refund) return { error: "No payment to refund." };
    await stripe.subscriptions.cancel(profile.stripeSubscriptionId);
    const isPro = profile.foundingNumber !== null;
    const withdrawal = { amountCents: refund.amount, stripeRefundId: refund.id };
    await prisma.$transaction(async (tx) => {
      if (profile.side === "brand") {
        await tx.startupProfile.update({ where: { id: profile.id }, data: { isPro, stripeSubscriptionId: null } });
        await tx.proWithdrawal.create({ data: { ...withdrawal, startupId: profile.id } });
      } else {
        await tx.creatorProfile.update({ where: { id: profile.id }, data: { isPro, stripeSubscriptionId: null } });
        await tx.proWithdrawal.create({ data: { ...withdrawal, creatorId: profile.id } });
      }
    });
  } catch (err) {
    console.error("Pro withdrawal failed:", err);
    return { error: "The withdrawal didn't go through. Try again, or write to info@comtor.app." };
  }

  revalidateSubscriptionPaths();
  revalidatePath("/admin/payments");
  return {};
}

async function refundLatestProPayment(subscriptionId: string, profileId: string) {
  const invoices = await stripe.invoices.list({ subscription: subscriptionId, status: "paid", limit: 1 });
  const invoice = invoices.data[0];
  if (!invoice) return null;
  const key = `pro-withdraw-${profileId}-${invoice.id}`;
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
