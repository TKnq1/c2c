import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FoundingSide } from "@/lib/founding";

// Pro lives on both profiles with the same fields (see schema.prisma). This reads and writes it the same way
// for a brand and a creator, so the subscription code doesn't fork per side.
export type ProProfile = {
  side: FoundingSide;
  id: string;
  name: string;
  isPro: boolean;
  proSince: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  foundingNumber: number | null;
};

export type ProUpdate = Partial<Pick<ProProfile, "isPro" | "proSince" | "stripeCustomerId" | "stripeSubscriptionId">>;

const SELECT = {
  id: true,
  isPro: true,
  proSince: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  foundingNumber: true,
} as const;

export function proSide(role: Role): FoundingSide | null {
  return role === "STARTUP" ? "brand" : role === "CREATOR" ? "creator" : null;
}

export async function findProProfile(userId: string, role: Role): Promise<ProProfile | null> {
  const side = proSide(role);
  if (side === "brand") {
    const brand = await prisma.startupProfile.findUnique({ where: { userId }, select: { ...SELECT, companyName: true } });
    return brand && { side, ...brand, name: brand.companyName };
  }
  if (side === "creator") {
    const creator = await prisma.creatorProfile.findUnique({ where: { userId }, select: { ...SELECT, displayName: true } });
    return creator && { side, ...creator, name: creator.displayName };
  }
  return null;
}

export async function updateProProfile(profile: Pick<ProProfile, "side" | "id">, data: ProUpdate): Promise<void> {
  if (profile.side === "brand") await prisma.startupProfile.update({ where: { id: profile.id }, data });
  else await prisma.creatorProfile.update({ where: { id: profile.id }, data });
}

// Where each side manages its plan.
export function planPath(side: FoundingSide): string {
  return side === "brand" ? "/dashboard/startup/settings#plan" : "/dashboard/creator/settings#plan";
}
