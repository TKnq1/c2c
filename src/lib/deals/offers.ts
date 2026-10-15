import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// What comes before a deal: open offers, and for a brand the creators who are interested but have no offer yet. Wherever the
// Deals screens are open these sit on the Deals list, so the Payments page only keeps the money.

const offerSelect = {
  id: true,
  requestId: true,
  amountCents: true,
  payoutCents: true,
  platformFeeCents: true,
  offerRole: true,
  offeredAt: true,
  createdAt: true,
  request: { select: { id: true, title: true, startup: { select: { companyName: true, avatarUrl: true, isPro: true } } } },
  creator: { select: { displayName: true, avatarUrl: true, isPro: true } },
} as const;

function interestWhereForUser(userId: string, role: Role) {
  return role === "STARTUP" ? { request: { startup: { userId } } } : { creator: { userId } };
}

// Offers on the table, newest first. An accepted offer is a deal, so none of these has one.
export async function listOpenOffers(userId: string, role: Role) {
  return prisma.interest.findMany({
    where: { ...interestWhereForUser(userId, role), paymentStatus: "OFFERED", deal: { is: null } },
    orderBy: { offeredAt: "desc" },
    select: offerSelect,
  });
}

// A brand's interested creators without an offer, newest first.
export async function listInterestedWithoutOffer(userId: string) {
  return prisma.interest.findMany({
    where: { ...interestWhereForUser(userId, "STARTUP"), paymentStatus: null, deal: { is: null } },
    orderBy: { createdAt: "desc" },
    select: offerSelect,
  });
}

export type OpenOffer = Awaited<ReturnType<typeof listOpenOffers>>[number];
