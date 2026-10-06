import { prisma } from "@/lib/prisma";
import { FOUNDING_BRAND_LIMIT } from "@/lib/constants";

// Any fixed number: every claim takes this lock first, so two sign-ups at the same moment can't both
// pick the same free number or push the count past the limit.
const CLAIM_LOCK_ID = 5_047_001;

// Gives a brand the lowest free founding number (1..FOUNDING_BRAND_LIMIT) and switches Pro on for it.
// Returns the number, or null when every number is taken. Claiming twice returns the number the brand
// already has. A deleted account frees its number, so the lowest free one can be below the highest used.
export async function claimFoundingPro(startupId: string): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CLAIM_LOCK_ID})`;

    const startup = await tx.startupProfile.findUnique({
      where: { id: startupId },
      select: { foundingNumber: true, proSince: true },
    });
    if (!startup) return null;
    if (startup.foundingNumber) return startup.foundingNumber;

    const taken = await tx.startupProfile.findMany({
      where: { foundingNumber: { not: null } },
      select: { foundingNumber: true },
    });
    const used = new Set(taken.map((row) => row.foundingNumber));
    let free: number | null = null;
    for (let n = 1; n <= FOUNDING_BRAND_LIMIT; n++) {
      if (!used.has(n)) {
        free = n;
        break;
      }
    }
    if (free === null) return null;

    await tx.startupProfile.update({
      where: { id: startupId },
      // A brand that gets its place now is told in the wizard and the welcome mail: no extra notice mail.
      data: { foundingNumber: free, isPro: true, proSince: startup.proSince ?? new Date(), foundingNoticeSentAt: new Date() },
    });
    return free;
  });
}

export async function claimFoundingProForUser(userId: string): Promise<number | null> {
  const startup = await prisma.startupProfile.findUnique({ where: { userId }, select: { id: true } });
  return startup ? claimFoundingPro(startup.id) : null;
}

// How many founding numbers are still free. Shown before sign-up, so it has to be the real count.
export async function foundingSpotsLeft(): Promise<number> {
  const taken = await prisma.startupProfile.count({ where: { foundingNumber: { not: null } } });
  return Math.max(0, FOUNDING_BRAND_LIMIT - taken);
}

// An admin takes the founding Pro away (e.g. a fake account). The number is free again.
// A brand that also pays for Pro itself keeps the subscription's Pro.
export async function revokeFoundingPro(startupId: string): Promise<void> {
  await prisma.$transaction([
    prisma.startupProfile.updateMany({
      where: { id: startupId, foundingNumber: { not: null }, stripeSubscriptionId: null },
      data: { foundingNumber: null, isPro: false },
    }),
    prisma.startupProfile.updateMany({
      where: { id: startupId, foundingNumber: { not: null }, stripeSubscriptionId: { not: null } },
      data: { foundingNumber: null },
    }),
  ]);
}
