import { prisma } from "@/lib/prisma";

// Count of things on the Payments page genuinely waiting on this user to
// act: an offer proposed by the other side, or a deposit the brand has
// requested. Mirrors getUnreadMessageCount's role for the nav badge.
export async function getPendingPaymentActionCount(userId: string) {
  // Filtered through the creator relation rather than a creatorId looked up
  // first — when there's no CreatorProfile for this user, that filter just
  // matches nothing, so the earlier guard query wasn't needed at all, and
  // this call site (dashboard/layout.tsx's own Promise.all) was paying an
  // extra sequential round-trip for it on every single dashboard page.
  const [offers, deposits] = await Promise.all([
    prisma.interest.count({ where: { creator: { userId }, paymentStatus: "OFFERED", offerRole: "STARTUP" } }),
    prisma.interest.count({ where: { creator: { userId }, depositStatus: "REQUESTED" } }),
  ]);
  return offers + deposits;
}
