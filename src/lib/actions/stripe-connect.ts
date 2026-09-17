"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Creates (once) or reuses this creator's Stripe Connect recipient account.
// Accounts v2, not the legacy v1 `type: 'express'` — see
// .agents/skills/connect-recommend for why: a recipient account
// (stripe_transfers capability only) is the correct shape for a marketplace
// seller who is paid out but never charges anyone directly, and the
// platform (not Stripe) owns fees/loss liability here to match the
// "express" dashboard we want creators to see.
async function getOrCreateConnectAccountId(creatorId: string, displayName: string, email: string | null | undefined) {
  const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { id: creatorId } });
  if (creator.stripeAccountId) return creator.stripeAccountId;

  const account = await stripe.v2.core.accounts.create({
    contact_email: email ?? undefined,
    display_name: displayName,
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
  await prisma.creatorProfile.update({ where: { id: creatorId }, data: { stripeAccountId: account.id } });
  return account.id;
}

// Embedded onboarding: an Account Session's client_secret lets Connect.js
// render Stripe's onboarding form inside our own page (see
// ConnectOnboardingEmbed) instead of redirecting out to a stripe.com page —
// same underlying identity/bank-detail collection, same Stripe compliance
// obligations, just without ever leaving the site. See
// .agents/skills/stripe-best-practices/references/connect.md: "Default to
// embedded onboarding."
export async function createEmbeddedOnboardingSessionAction(): Promise<{ clientSecret: string } | { error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") return { error: "Not authorized." };

  const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const accountId = await getOrCreateConnectAccountId(creator.id, creator.displayName, session.user.email);

  const accountSession = await stripe.accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: { enabled: true },
    },
  });

  return { clientSecret: accountSession.client_secret };
}
