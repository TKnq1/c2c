import { prisma } from "@/lib/prisma";

// Count of things on the Payments page genuinely waiting on this user to
// act: an offer proposed by the other side, or a deposit the brand has
// requested. Mirrors getUnreadMessageCount's role for the nav badge.
export async function getPendingPaymentActionCount(userId: string) {
  const creator = await prisma.creatorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!creator) return 0;

  const [offers, deposits] = await Promise.all([
    prisma.interest.count({ where: { creatorId: creator.id, paymentStatus: "OFFERED", offerRole: "STARTUP" } }),
    prisma.interest.count({ where: { creatorId: creator.id, depositStatus: "REQUESTED" } }),
  ]);
  return offers + deposits;
}
