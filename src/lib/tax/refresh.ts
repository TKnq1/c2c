import { prisma } from "@/lib/prisma";
import { verifyStoredVatId } from "@/lib/tax/verify-profile";
import { DAY } from "@/lib/rate-limit";

const RECHECK_AFTER_DAYS = 90;
const BATCH = 15;

// A VAT ID that was valid can be deregistered, and one VIES could not answer for is still waiting for its verdict: both are
// asked again, a few per day so the daily job stays short and VIES is not hammered.
export async function refreshStaleVatIds(now = new Date()): Promise<number> {
  const stale = await prisma.businessProfile.findMany({
    where: {
      vatId: { not: null },
      OR: [
        { vatIdStatus: "UNAVAILABLE" },
        { vatIdStatus: "UNCHECKED" },
        { vatIdStatus: "VALID", vatIdCheckedAt: { lt: new Date(now.getTime() - RECHECK_AFTER_DAYS * DAY) } },
      ],
    },
    orderBy: { vatIdCheckedAt: { sort: "asc", nulls: "first" } },
    select: { userId: true },
    take: BATCH,
  });
  for (const { userId } of stale) await verifyStoredVatId(userId);
  return stale.length;
}
