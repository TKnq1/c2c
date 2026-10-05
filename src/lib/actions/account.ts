"use server";

import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { anonymiseAccount, hasPaymentRecords, moneyInFlight } from "@/lib/account-deletion";
import { verifyPassword } from "@/lib/password";
import { MINUTE, takeToken } from "@/lib/rate-limit";
import { deleteAccountSchema } from "@/lib/validation";

export type DeleteAccountState = { error?: string } | undefined;

export async function deleteAccountAction(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const parsed = deleteAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter your current password." };
  }

  if (!(await takeToken("password-check", session.user.id, 5, 15 * MINUTE))) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!(await verifyPassword(user, parsed.data.password))) return { error: "Incorrect password." };

  // Money in escrow, or an accepted offer waiting to be paid, needs this account to finish.
  if ((await moneyInFlight(user.id)) > 0) {
    return { error: "A payment is still in progress. Finish or cancel it first, then you can delete your account." };
  }

  // A Pro subscription would keep billing someone whose account is gone.
  const startup = await prisma.startupProfile.findUnique({
    where: { userId: user.id },
    select: { stripeSubscriptionId: true },
  });
  if (startup?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(startup.stripeSubscriptionId);
    } catch (err) {
      console.error("Cancelling the Pro subscription before deleting an account failed:", err);
      return { error: "We couldn't cancel your Pro subscription. Try again, or cancel it under Settings first." };
    }
  }

  if (await hasPaymentRecords(user.id)) {
    // The payment rows have to stay; the person doesn't (see account-deletion.ts).
    await anonymiseAccount(user.id, user.role);
  } else {
    // Every user-owned row cascades from here (profile, requests/interests,
    // messages, reviews, notifications, tokens, reports, blocks, ...) per the
    // onDelete: Cascade relations in schema.prisma.
    await prisma.user.delete({ where: { id: user.id } });
  }

  await signOut({ redirectTo: "/login?deleted=1" });
}
