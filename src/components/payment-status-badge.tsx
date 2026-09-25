import type { PaymentStatus } from "@prisma/client";

// What a payment shows as. The two approval sub-steps aren't statuses of
// their own in the database (the money is HELD throughout) — they're
// derived from when the post was submitted and whether a problem was
// reported, via paymentStage below.
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

const LABELS: Record<PaymentStage, string> = {
  // Read by both sides — "Offer sent" was only true for whoever sent it.
  OFFERED: "Offer pending",
  ACCEPTED: "Awaiting payment",
  HELD: "In escrow",
  SUBMITTED: "Awaiting approval",
  DISPUTED: "Under review",
  RELEASED: "Released",
  REFUNDED: "Refunded",
};
// Status conveyed through fill weight, not color: outline (proposed) →
// stronger outline (accepted, held) → tinted (posted, waiting on the
// brand) → filled ink (done) → muted fog (closed). A dispute is the one
// dashed outline — on hold, neither moving forward nor closed.
const STYLES: Record<PaymentStage, string> = {
  OFFERED: "border border-ink/20 text-graphite",
  ACCEPTED: "border border-ink/40 text-ink",
  HELD: "border border-ink text-ink",
  SUBMITTED: "border border-ink bg-fog text-ink",
  DISPUTED: "border border-dashed border-ink text-ink",
  RELEASED: "bg-ink text-paper",
  REFUNDED: "bg-fog text-stone",
};

export function PaymentStatusBadge({ status }: { status: PaymentStage }) {
  return (
    <span className={`text-xs rounded-full px-2.5 py-1 whitespace-nowrap font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
