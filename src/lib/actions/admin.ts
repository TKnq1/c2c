"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAdminAccess } from "@/lib/admin-access";
import { confirmAdminPassword, requireAdmin } from "@/lib/admin-guard";
import { anonymiseAccount, hasPaymentRecords, moneyInFlight } from "@/lib/account-deletion";
import { audit } from "@/lib/audit";
import { revokeFoundingPro } from "@/lib/founding";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { accountSuspendedEmail, testEmail } from "@/lib/email-templates";
import { parseLocale } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/site";

// Same shape ConfirmActionButton expects: an error message, or nothing.
export type AdminActionResult = { error?: string };

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

const suspendSchema = z.object({
  reason: z.string().trim().min(3, "Give a short reason (at least 3 characters).").max(500),
});

// Suspending also closes the account's open requests, so brands that are
// locked out don't keep collecting interest from creators in the Feed.
export async function suspendUserAction(userId: string, reason: string): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  if (userId === session.user.id) return { error: "You can't suspend your own account." };

  const parsed = suspendSchema.safeParse({ reason });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { startupProfile: true } });
  if (!user) return { error: "This account no longer exists." };
  if (hasAdminAccess(user)) return { error: "Admin accounts can't be suspended here." };
  if (user.suspendedAt) return { error: "This account is already suspended." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: new Date(), suspendedReason: parsed.data.reason },
    }),
    ...(user.startupProfile
      ? [
          prisma.request.updateMany({
            where: { startupId: user.startupProfile.id, status: "OPEN" },
            data: { status: "CLOSED", closedByAdmin: true },
          }),
        ]
      : []),
  ]);

  await audit(session.user.id, "user.suspend", userId, { reason: parsed.data.reason });
  // The person is told why, and how to object. A failed mail doesn't undo the suspension (sendEmail logs it).
  await sendEmail({ to: user.email, ...accountSuspendedEmail(parsed.data.reason, parseLocale(user.locale)) });
  revalidateAdmin();
  return {};
}

export async function unsuspendUserAction(userId: string): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { suspendedAt: true } });
  if (!user) return { error: "This account no longer exists." };
  if (!user.suspendedAt) return { error: "This account isn't suspended." };

  await prisma.user.update({ where: { id: userId }, data: { suspendedAt: null, suspendedReason: null } });

  await audit(session.user.id, "user.unsuspend", userId);
  revalidateAdmin();
  return {};
}

// Takes the founding Pro away from a brand (e.g. a fake account) and frees its number for the next brand.
export async function revokeFoundingProAction(userId: string): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };

  const profile = await prisma.startupProfile.findUnique({
    where: { userId },
    select: { id: true, foundingNumber: true },
  });
  if (!profile?.foundingNumber) return { error: "This brand isn't a founding brand." };

  await revokeFoundingPro(profile.id);
  await audit(session.user.id, "user.revokeFoundingPro", userId, { foundingNumber: profile.foundingNumber });
  revalidateAdmin();
  return {};
}

export async function setRequestStatusAction(requestId: string, status: "OPEN" | "CLOSED"): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { status: true, startup: { select: { user: { select: { suspendedAt: true } } } } },
  });
  if (!request) return { error: "This request no longer exists." };
  if (request.status === status) return { error: `This request is already ${status === "OPEN" ? "open" : "closed"}.` };
  if (status === "OPEN" && request.startup.user.suspendedAt) {
    return { error: "The brand behind this request is suspended. Unsuspend the account first." };
  }

  // Closed by moderation, a brand can't reopen it itself (see reopenRequestAction).
  await prisma.request.update({ where: { id: requestId }, data: { status, closedByAdmin: status === "CLOSED" } });

  await audit(session.user.id, status === "CLOSED" ? "request.close" : "request.open", requestId);
  revalidateAdmin();
  revalidatePath("/dashboard/creator");
  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  return {};
}

// One test email to the admin's own address, and what the email service
// answered: the id when it took the mail, its error when it didn't. Returned,
// not thrown, so the message survives to production (see errorMessage).
export async function sendTestEmailAction(): Promise<{ error?: string; to?: string; id?: string }> {
  const session = await requireAdmin();
  if (!session?.user.email) return { error: "Not authorized." };

  const to = session.user.email;
  const result = await sendEmail({ to, ...testEmail(SITE_URL) });
  return result.ok ? { to, id: result.id } : { error: result.error };
}

// Deletes an account the way the account's own "Delete account" does (see
// account-deletion.ts): money still in flight blocks it, an account with
// payment records is anonymised so those records stay, anything else goes
// with everything that belongs to it. For test accounts and clean-ups. It
// refuses what shouldn't go this way: yourself, other admins, and any
// account with a Stripe connection or a payment through Stripe, since those
// leave money or a subscription behind in Stripe that this wouldn't touch.
export async function deleteUserAction(userId: string, password: string): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  if (userId === session.user.id) return { error: "You can't delete your own account here." };
  const passwordError = await confirmAdminPassword(session.user.id, password);
  if (passwordError) return { error: passwordError };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { startupProfile: true, creatorProfile: true },
  });
  if (!user) return { error: "This account no longer exists." };
  if (hasAdminAccess(user)) return { error: "Admin accounts can't be deleted here." };

  const stripePayments = await prisma.interest.count({
    where: {
      AND: [
        { OR: [{ creator: { userId } }, { request: { startup: { userId } } }] },
        {
          OR: [
            { stripeCheckoutSessionId: { not: null } },
            { stripeChargeId: { not: null } },
            { stripeTransferId: { not: null } },
            { stripeRefundId: { not: null } },
          ],
        },
      ],
    },
  });
  const stripeLinked =
    !!user.startupProfile?.stripeCustomerId ||
    !!user.startupProfile?.stripeSubscriptionId ||
    !!user.creatorProfile?.stripeAccountId ||
    stripePayments > 0;
  if (stripeLinked) {
    return { error: "This account is connected to Stripe or has payments through it. Deleting it here would leave those behind in Stripe." };
  }

  if ((await moneyInFlight(userId)) > 0) {
    return { error: "A payment is still in progress for this account. It has to be finished or cancelled first." };
  }

  const anonymise = await hasPaymentRecords(userId);
  await audit(session.user.id, "user.delete", userId, { email: user.email, role: user.role, anonymised: anonymise });
  if (anonymise) await anonymiseAccount(userId, user.role);
  else await prisma.user.delete({ where: { id: userId } });
  revalidateAdmin();
  return {};
}
