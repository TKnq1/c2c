import { prisma } from "@/lib/prisma";
import { DEPOSITS_ENABLED } from "@/lib/constants";

// Count of things on the Payments page genuinely waiting on this user to
// act: an offer proposed by the other side, or (while deposits are on) a
// deposit the brand has requested. Mirrors getUnreadMessageCount's role for
// the nav badge.
export async function getPendingPaymentActionCount(userId: string) {
  // Filtered through the creator relation rather than a creatorId looked up
  // first — when there's no CreatorProfile for this user, that filter just
  // matches nothing, so the earlier guard query wasn't needed at all, and
  // this call site (dashboard/layout.tsx's own Promise.all) was paying an
  // extra sequential round-trip for it on every single dashboard page.
  const [offers, deposits] = await Promise.all([
    prisma.interest.count({ where: { creator: { userId }, paymentStatus: "OFFERED", offerRole: "STARTUP" } }),
    DEPOSITS_ENABLED ? prisma.interest.count({ where: { creator: { userId }, depositStatus: "REQUESTED" } }) : 0,
  ]);
  return offers + deposits;
}

// The brand side of the same badge: a creator's counter-offer waiting on an
// answer, an accepted offer that still has to be paid before anything is
// held in escrow, or a submitted post waiting on approval.
export async function getBrandPendingPaymentActionCount(userId: string) {
  return prisma.interest.count({
    where: {
      request: { startup: { userId } },
      OR: [
        { paymentStatus: "OFFERED", offerRole: "CREATOR" },
        { paymentStatus: "ACCEPTED" },
        { paymentStatus: "HELD", proofSubmittedAt: { not: null }, disputedAt: null },
      ],
    },
  });
}
