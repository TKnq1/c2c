import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { formatCents } from "@/lib/format";
import { flagForReview } from "@/lib/moderation";

// Fulfillment lives here, not on the checkout return page — a brand can pay
// successfully and never make it back to our site (closed tab, lost
// connection), so the webhook is the only reliable source of truth for
// "did the money actually move." See .agents/skills/stripe-best-practices.
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!.trim());
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.payment_status === "unpaid") break;

      // Pro subscription checkout (mode: "subscription") vs. a collab
      // payment (mode: "payment") — different session shape, different
      // row to update, so these branch entirely rather than sharing logic.
      if (checkoutSession.mode === "subscription") {
        const customerId =
          typeof checkoutSession.customer === "string" ? checkoutSession.customer : null;
        const subscriptionId =
          typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : null;
        if (!customerId || !subscriptionId) break;

        await prisma.startupProfile.updateMany({
          where: { stripeCustomerId: customerId },
          data: { isPro: true, proSince: new Date(), stripeSubscriptionId: subscriptionId },
        });
        break;
      }

      const interest = await prisma.interest.findUnique({
        where: { stripeCheckoutSessionId: checkoutSession.id },
        include: { request: { include: { startup: true } }, creator: true },
      });
      // Already handled (completed and async_payment_succeeded can both
      // fire for the same session) or the interest was somehow removed —
      // either way there's nothing left to do.
      if (!interest || interest.paymentStatus !== "ACCEPTED") break;

      // The session was created for exactly this amount (createCheckoutSessionAction). If what was
      // paid isn't that, nothing is marked as held: a person looks at it.
      if (checkoutSession.amount_total !== interest.amountCents || checkoutSession.currency !== "eur") {
        console.error("Checkout amount mismatch", { interestId: interest.id, session: checkoutSession.id });
        await flagForReview(
          interest.request.startup.userId,
          "Payment amount mismatch",
          `Checkout ${checkoutSession.id} for interest ${interest.id}: paid ${checkoutSession.amount_total} ${checkoutSession.currency}, expected ${interest.amountCents} eur.`,
        );
        break;
      }

      // releaseHeldPayment's transfer needs a Charge id (source_transaction
      // only accepts ch_..., see .agents/skills/connect-recommend/references/
      // charge-patterns.md) — the session only carries the PaymentIntent id,
      // so the charge has to be resolved via its latest_charge.
      const paymentIntentId =
        typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : null;
      const paymentIntent = paymentIntentId ? await stripe.paymentIntents.retrieve(paymentIntentId) : null;
      const chargeId = typeof paymentIntent?.latest_charge === "string" ? paymentIntent.latest_charge : null;

      // Only one of two parallel deliveries (completed and async_payment_succeeded can both fire) gets to
      // flip the row, and so only one notifies.
      const claimed = await prisma.interest.updateMany({
        where: { id: interest.id, paymentStatus: "ACCEPTED" },
        data: { paymentStatus: "HELD", paidAt: new Date(), stripeChargeId: chargeId },
      });
      if (claimed.count === 0) break;

      await notify(
        interest.creator.userId,
        `${interest.request.startup.companyName}'s payment of ${formatCents(interest.amountCents!)} for "${interest.request.title}" is now held in escrow`,
        "/dashboard/creator/payments",
        "payments",
      );
      break;
    }

    case "checkout.session.async_payment_failed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const interest = await prisma.interest.findUnique({
        where: { stripeCheckoutSessionId: checkoutSession.id },
        include: { request: { include: { startup: true } } },
      });
      if (!interest || interest.paymentStatus !== "ACCEPTED") break;

      // Stays ACCEPTED — the brand still owes payment and can retry from
      // their payments page, same as if they'd never started checkout.
      await notify(
        interest.request.startup.userId,
        `Your payment for "${interest.request.title}" failed. Try again from Payments.`,
        "/dashboard/startup/payments",
        "payments",
      );
      break;
    }

    case "customer.subscription.updated": {
      // Covers renewals, reactivations, and payment failures moving the
      // subscription out of "active" (e.g. "past_due") — isPro tracks
      // "currently entitled to the reduced fee," not "has ever subscribed."
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) break;

      await prisma.startupProfile.updateMany({
        where: { stripeCustomerId: customerId },
        data: { isPro: subscription.status === "active" || subscription.status === "trialing" },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) break;

      await prisma.startupProfile.updateMany({
        where: { stripeCustomerId: customerId },
        data: { isPro: false, stripeSubscriptionId: null },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
