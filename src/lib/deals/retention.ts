import { prisma } from "@/lib/prisma";
import { DAY_MS, DEAL_POLICY } from "@/lib/deals/policy";

// How long personal data from a deal is kept. The proof images (screenshots of a creator's analytics or account) are needed to
// verify a post and to decide a dispute, not afterwards: this long after a deal ended (completed or cancelled), with no dispute
// open, the image is deleted. The row stays with its hash, so it remains on record that a proof existed and what it was.
// Run by the daily job.
export async function purgeOldProofs(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - DEAL_POLICY.proofRetentionDays * DAY_MS);
  const purged = await prisma.dealProof.updateMany({
    where: {
      purgedAt: null,
      post: { deal: { status: { in: ["COMPLETED", "CANCELLED"] }, statusChangedAt: { lte: cutoff }, disputes: { none: { status: "OPEN" } } } },
    },
    data: { data: new Uint8Array(0), purgedAt: now },
  });
  return purged.count;
}
