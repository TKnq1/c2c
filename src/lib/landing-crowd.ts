import { prisma } from "@/lib/prisma";

// Every account of that side, including one that just signed up. Suspended
// accounts are gone from the product, so they are not "already here".
export async function landingCrowd() {
  const [brands, creators] = await Promise.all([
    prisma.user.count({ where: { role: "STARTUP", suspendedAt: null } }),
    prisma.user.count({ where: { role: "CREATOR", suspendedAt: null } }),
  ]);
  return { brands, creators };
}
