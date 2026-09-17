import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  // @ts-expect-error retrieve() with no id returns the platform's own account
  const account = await stripe.accounts.retrieve();
  return NextResponse.json({
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements,
    controller: account.controller,
  });
}
