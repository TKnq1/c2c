import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { formatCents } from "@/lib/format";

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
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.payment_status === "unpaid") break;

      const interest = await prisma.interest.findUnique({
        where: { stripeCheckoutSessionId: checkoutSession.id },
        include: { request: { include: { startup: true } }, creator: true },
      });
      // Already handled (completed and async_payment_succeeded can both
      // fire for the same session) or the interest was somehow removed —
      // either way there's nothing left to do.
      if (!interest || interest.paymentStatus !== "ACCEPTED") break;

      await prisma.interest.update({
        where: { id: interest.id },
        data: {
          paymentStatus: "HELD",
          paidAt: new Date(),
          stripeChargeId: typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : null,
        },
      });

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
        `Your payment for "${interest.request.title}" failed — try again from Payments`,
        "/dashboard/startup/payments",
        "payments",
      );
      break;
    }

    case "account.updated": {
      // Recipient-account go-live check — see .agents/skills/stripe-best-practices
      // (do NOT use deprecated payouts_enabled/charges_enabled). The webhook
      // payload's shape isn't guaranteed to match the v2 account shape, so
      // re-fetch through the v2 API rather than trusting event.data.object.
      const accountId = (event.data.object as { id: string }).id;
      const account = await stripe.v2.core.accounts.retrieve(accountId);
      const transfersActive =
        account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";
      await prisma.creatorProfile.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeOnboarded: transfersActive },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
