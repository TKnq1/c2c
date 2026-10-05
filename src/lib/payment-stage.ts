import type { PaymentStatus } from "@prisma/client";

// What a payment shows as. The two approval sub-steps aren't statuses of
// their own in the database (the money is HELD throughout) — they're
// derived from when the post was submitted and whether a problem was
// reported. Kept out of the badge component: that file is a client module,
// and a server page cannot call a function that lives there.
export type PaymentStage = PaymentStatus | "SUBMITTED" | "DISPUTED";

export function paymentStage(i: {
  paymentStatus: PaymentStatus;
  proofSubmittedAt: Date | number | null;
  disputedAt: Date | number | null;
}): PaymentStage {
  if (i.paymentStatus !== "HELD") return i.paymentStatus;
  if (i.disputedAt) return "DISPUTED";
  if (i.proofSubmittedAt) return "SUBMITTED";
  return "HELD";
}
