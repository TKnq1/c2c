"use client";

import type { PaymentStatus } from "@prisma/client";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

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

const LABELS: Record<PaymentStage, MessageKey> = {
  OFFERED: "screens.payments.offerPending",
  ACCEPTED: "screens.payments.awaitingPayment",
  HELD: "screens.payments.inEscrow",
  SUBMITTED: "screens.payments.awaitingApproval",
  DISPUTED: "screens.payments.underReview",
  RELEASED: "screens.payments.released",
  REFUNDED: "screens.payments.refunded",
};
// Status conveyed through fill weight, not color: outline (proposed) →
// stronger outline (accepted, held) → tinted (posted, waiting on the
// brand) → filled ink (done) → muted tint (closed). The tints are ink at low
// alpha, so they show on a white page and on a grey panel alike. A dispute
// is the one
// dashed outline: on hold, neither moving forward nor closed.
const STYLES: Record<PaymentStage, string> = {
  OFFERED: "border border-ink/20 text-graphite",
  ACCEPTED: "border border-ink/40 text-ink",
  HELD: "border border-ink text-ink",
  SUBMITTED: "border border-ink bg-ink/10 text-ink",
  DISPUTED: "border border-dashed border-ink text-ink",
  RELEASED: "bg-ink text-paper",
  REFUNDED: "bg-ink/10 text-stone",
};

export function PaymentStatusBadge({ status }: { status: PaymentStage }) {
  const { t } = useI18n();
  return (
    <span className={`text-xs rounded-full px-2.5 py-1 whitespace-nowrap font-medium ${STYLES[status]}`}>
      {t(LABELS[status])}
    </span>
  );
}
