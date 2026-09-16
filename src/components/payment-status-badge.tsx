import type { PaymentStatus } from "@prisma/client";

const LABELS: Record<PaymentStatus, string> = {
  OFFERED: "Offer sent",
  ACCEPTED: "Awaiting payment",
  HELD: "In escrow",
  RELEASED: "Released",
  REFUNDED: "Refunded",
};
// Status conveyed through fill weight, not color: outline (proposed) →
// stronger outline (accepted, held) → filled ink (done) → muted fog (closed).
const STYLES: Record<PaymentStatus, string> = {
  OFFERED: "border border-ink/20 text-graphite",
  ACCEPTED: "border border-ink/40 text-ink",
  HELD: "border border-ink text-ink",
  RELEASED: "bg-ink text-paper",
  REFUNDED: "bg-fog text-stone",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`text-xs rounded px-3 py-1 whitespace-nowrap font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
