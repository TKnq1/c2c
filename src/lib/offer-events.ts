import type { OfferEventOutcome, Prisma, Role } from "@prisma/client";

// Appends a proposal and closes the one that was still open. The interest
// row keeps only the current amount; this table is the negotiation itself.
export async function recordProposal(
  db: Prisma.TransactionClient,
  input: { interestId: string; role: Role; amountCents: number; payoutCents: number },
) {
  await db.offerEvent.updateMany({
    where: { interestId: input.interestId, outcome: "PENDING" },
    data: { outcome: "SUPERSEDED" },
  });
  await db.offerEvent.create({
    data: {
      interestId: input.interestId,
      role: input.role,
      amountCents: input.amountCents,
      payoutCents: input.payoutCents,
      outcome: "PENDING",
    },
  });
}

export async function settleProposal(
  db: Prisma.TransactionClient,
  interestId: string,
  outcome: Extract<OfferEventOutcome, "DECLINED" | "WITHDRAWN" | "ACCEPTED">,
) {
  await db.offerEvent.updateMany({
    where: { interestId, outcome: "PENDING" },
    data: { outcome },
  });
}
