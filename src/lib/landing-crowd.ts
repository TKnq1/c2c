import { prisma } from "@/lib/prisma";

// People who finished enough of onboarding to have a name. A fresh account
// still has the empty placeholder, so it isn't "already here" yet.
export async function landingCrowd() {
  const [brands, creators] = await Promise.all([
    prisma.startupProfile.count({
      where: { companyName: { not: "" }, user: { suspendedAt: null, role: "STARTUP" } },
    }),
    prisma.creatorProfile.count({
      where: { displayName: { not: "" }, user: { suspendedAt: null, role: "CREATOR" } },
    }),
  ]);
  return { brands, creators };
}
