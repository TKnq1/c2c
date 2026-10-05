import type { Prisma, Role } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// Deleting an account must neither lose money nor destroy the records of money that moved.
//
// - Money still in flight (an accepted offer waiting for payment, an escrow, a deposit) blocks it:
//   the account is needed to finish or cancel that.
// - Once everything is settled, an account with no payment records behind it is removed completely
//   (everything hangs off the user row and goes with it).
// - An account with payment records (a released or refunded payment, anything that went through Stripe)
//   is anonymised instead: the person, their texts and their conversations go, the payment rows stay
//   because accounting rules require keeping them. They no longer point at anyone.

export function participantOf(userId: string): Prisma.InterestWhereInput {
  return { OR: [{ creator: { userId } }, { request: { startup: { userId } } }] };
}

const PAYMENT_RECORD: Prisma.InterestWhereInput = {
  OR: [
    { paymentStatus: { in: ["RELEASED", "REFUNDED"] } },
    { stripeChargeId: { not: null } },
    { stripeTransferId: { not: null } },
    { stripeRefundId: { not: null } },
  ],
};

export function moneyInFlight(userId: string) {
  return prisma.interest.count({
    where: {
      AND: [
        participantOf(userId),
        { OR: [{ paymentStatus: { in: ["ACCEPTED", "HELD"] } }, { depositStatus: { in: ["REQUESTED", "HELD"] } }] },
      ],
    },
  });
}

export async function hasPaymentRecords(userId: string): Promise<boolean> {
  const [collabs, proWithdrawals] = await Promise.all([
    prisma.interest.count({ where: { AND: [participantOf(userId), PAYMENT_RECORD] } }),
    prisma.proWithdrawal.count({ where: { startup: { userId } } }),
  ]);
  return collabs + proWithdrawals > 0;
}

export async function anonymiseAccount(userId: string, role: Role) {
  const now = new Date();
  const unusablePassword = await hashPassword(randomBytes(32).toString("hex"));
  const mine = participantOf(userId);

  await prisma.$transaction([
    // Collabs without a payment behind them are just conversations: gone (messages, offers, reviews with them).
    prisma.interest.deleteMany({ where: { AND: [mine, { NOT: PAYMENT_RECORD }] } }),
    // Requests nothing is left on, with their photos.
    prisma.request.deleteMany({ where: { startup: { userId }, interests: { none: {} } } }),
    prisma.request.updateMany({ where: { startup: { userId }, status: "OPEN" }, data: { status: "CLOSED" } }),
    // What is kept is the payment, not what was said around it.
    prisma.message.deleteMany({ where: { interest: mine } }),
    prisma.review.updateMany({ where: { interest: mine, authorRole: role }, data: { comment: null } }),
    prisma.creatorPlatform.deleteMany({ where: { creator: { userId } } }),
    prisma.startupSocialLink.deleteMany({ where: { startup: { userId } } }),
    prisma.creatorProfile.updateMany({
      where: { userId },
      data: { displayName: "Deleted creator", avatarUrl: null, bio: null },
    }),
    prisma.startupProfile.updateMany({
      where: { userId },
      data: { companyName: "Deleted brand", avatarUrl: null, website: null, description: null, lookingFor: null },
    }),
    prisma.favorite.deleteMany({ where: { OR: [{ creator: { userId } }, { startup: { userId } }] } }),
    prisma.requestPass.deleteMany({ where: { creator: { userId } } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    prisma.nativePushToken.deleteMany({ where: { userId } }),
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    prisma.loginAttempt.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted+${userId}@invalid.local`,
        passwordHash: unusablePassword,
        totpEnabled: false,
        totpSecret: null,
        totpLastStep: null,
        deletedAt: now,
        // Everything that hides a suspended account hides this one: Discover, the feed, search, sign-in.
        suspendedAt: now,
        suspendedReason: "Account deleted by the user",
        sessionsRevokedAt: now,
        keptSessionId: null,
        isAdmin: false,
      },
    }),
  ]);
}
