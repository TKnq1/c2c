"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

// Creates (once) or reuses this creator's Stripe Connect recipient account,
// then returns a fresh onboarding link. Accounts v2, not the legacy v1
// `type: 'express'` — see .agents/skills/connect-recommend for why: a
// recipient account (stripe_transfers capability only) is the correct
// shape for a marketplace seller who is paid out but never charges anyone
// directly, and the platform (not Stripe) owns fees/loss liability here to
// match the "express" dashboard we want creators to see.
export async function createConnectOnboardingLinkAction(): Promise<{ url: string } | { error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") return { error: "Not authorized." };

  const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });

  let accountId = creator.stripeAccountId;
  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      contact_email: session.user.email ?? undefined,
      display_name: creator.displayName,
      dashboard: "express",
      identity: { country: "de", entity_type: "individual" },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: { stripe_transfers: { requested: true } },
          },
        },
      },
      defaults: {
        currency: "eur",
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
    });
    accountId = account.id;
    await prisma.creatorProfile.update({ where: { id: creator.id }, data: { stripeAccountId: accountId } });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${SITE_URL}/dashboard/creator/settings#payouts`,
    return_url: `${SITE_URL}/dashboard/creator/settings#payouts`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}
