import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FOUNDING_LIMIT, type FoundingSide } from "@/lib/founding-limits";

export { FOUNDING_LIMIT, type FoundingSide };

// Any fixed numbers, one per side: every claim takes its side's lock first, so two sign-ups at the same moment
// can't both pick the same free number or push the count past the limit.
const CLAIM_LOCK_ID: Record<FoundingSide, number> = { brand: 5_047_001, creator: 5_047_002 };

type Tx = Prisma.TransactionClient;

// The pieces of a profile the founding places touch, read the same way from either table.
type FoundingProfile = { foundingNumber: number | null; proSince: Date | null };

function findProfile(tx: Tx, side: FoundingSide, id: string): Promise<FoundingProfile | null> {
  const select = { foundingNumber: true, proSince: true } as const;
  return side === "brand"
    ? tx.startupProfile.findUnique({ where: { id }, select })
    : tx.creatorProfile.findUnique({ where: { id }, select });
}

async function takenNumbers(tx: Tx, side: FoundingSide): Promise<Set<number | null>> {
  const where = { foundingNumber: { not: null } };
  const select = { foundingNumber: true } as const;
  const rows = side === "brand" ? await tx.startupProfile.findMany({ where, select }) : await tx.creatorProfile.findMany({ where, select });
  return new Set(rows.map((row) => row.foundingNumber));
}

// Gives a brand or a creator the lowest free founding number (1..its side's limit) and switches Pro on for it.
// Returns the number, or null when every number is taken. Claiming twice returns the number the profile
// already has. A deleted account frees its number, so the lowest free one can be below the highest used.
export async function claimFoundingPro(side: FoundingSide, profileId: string): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CLAIM_LOCK_ID[side]})`;

    const profile = await findProfile(tx, side, profileId);
    if (!profile) return null;
    if (profile.foundingNumber) return profile.foundingNumber;

    const used = await takenNumbers(tx, side);
    let free: number | null = null;
    for (let n = 1; n <= FOUNDING_LIMIT[side]; n++) {
      if (!used.has(n)) {
        free = n;
        break;
      }
    }
    if (free === null) return null;

    // A profile that gets its place now is told in the wizard and the welcome mail: no extra notice mail.
    const data = { foundingNumber: free, isPro: true, proSince: profile.proSince ?? new Date(), foundingNoticeSentAt: new Date() };
    if (side === "brand") await tx.startupProfile.update({ where: { id: profileId }, data });
    else await tx.creatorProfile.update({ where: { id: profileId }, data });
    return free;
  });
}

// The founding place for a freshly created account, whichever side it is on.
export async function claimFoundingProForUser(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { startupProfile: { select: { id: true } }, creatorProfile: { select: { id: true } } },
  });
  if (user?.startupProfile) return claimFoundingPro("brand", user.startupProfile.id);
  if (user?.creatorProfile) return claimFoundingPro("creator", user.creatorProfile.id);
  return null;
}

// How many founding numbers are still free on a side. Shown before sign-up, so it has to be the real count.
export async function foundingSpotsLeft(side: FoundingSide): Promise<number> {
  const where = { foundingNumber: { not: null } };
  const taken = side === "brand" ? await prisma.startupProfile.count({ where }) : await prisma.creatorProfile.count({ where });
  return Math.max(0, FOUNDING_LIMIT[side] - taken);
}

// An admin takes the founding Pro away (e.g. a fake account). The number is free again.
// A profile that also pays for Pro itself keeps the subscription's Pro.
export async function revokeFoundingPro(side: FoundingSide, profileId: string): Promise<void> {
  const unpaid = { id: profileId, foundingNumber: { not: null }, stripeSubscriptionId: null };
  const paid = { id: profileId, foundingNumber: { not: null }, stripeSubscriptionId: { not: null } };
  if (side === "brand") {
    await prisma.$transaction([
      prisma.startupProfile.updateMany({ where: unpaid, data: { foundingNumber: null, isPro: false } }),
      prisma.startupProfile.updateMany({ where: paid, data: { foundingNumber: null } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.creatorProfile.updateMany({ where: unpaid, data: { foundingNumber: null, isPro: false } }),
      prisma.creatorProfile.updateMany({ where: paid, data: { foundingNumber: null } }),
    ]);
  }
}
