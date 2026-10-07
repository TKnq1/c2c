import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Every account of that side, including one that just signed up. Suspended
// accounts are gone from the product, so they are not "already here".
// Cached for five minutes: the landing page asks on every visit, and the number is a headline, not a ledger.
export const landingCrowd = unstable_cache(
  async () => {
    const [brands, creators] = await Promise.all([
      prisma.user.count({ where: { role: "STARTUP", suspendedAt: null } }),
      prisma.user.count({ where: { role: "CREATOR", suspendedAt: null } }),
    ]);
    return { brands, creators };
  },
  ["landing-crowd"],
  { revalidate: 300 },
);
