import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Separate endpoint (and separate signing secret) because v2 Core accounts
// fire v2 "thin" event notifications, not v1 events — Stripe rejects a
// single destination that mixes 'thin' and 'snapshot' payload types, so this
// can't just be another case in the main webhook's switch statement.
type AccountUpdatedNotification = {
  type: string;
  related_object?: { id: string } | null;
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let notification: AccountUpdatedNotification;
  try {
    notification = stripe.parseEventNotification(
      body,
      signature,
      process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!.trim(),
    ) as unknown as AccountUpdatedNotification;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (notification.type === "v2.core.account.updated" && notification.related_object) {
    // Thin events carry only the id — re-fetch through the v2 API rather
    // than trusting any payload data. `configuration` (and everything
    // nested under it) is omitted from the response unless explicitly
    // requested via `include`.
    const account = await stripe.v2.core.accounts.retrieve(notification.related_object.id, {
      include: ["configuration.recipient"],
    });
    const transfersActive =
      account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";
    await prisma.creatorProfile.updateMany({
      where: { stripeAccountId: account.id },
      data: { stripeOnboarded: transfersActive },
    });
  }

  return NextResponse.json({ received: true });
}
