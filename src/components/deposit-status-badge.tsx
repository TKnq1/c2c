import type { DepositStatus } from "@prisma/client";

const LABELS: Record<DepositStatus, string> = {
  REQUESTED: "Deposit requested",
  HELD: "Deposit held",
  RELEASED: "Deposit returned",
  FORFEITED: "Deposit kept",
};
// Status conveyed through fill weight, not color: outline (pending) →
// stronger outline (active) → filled ink (done) → muted tint (closed),
// ink at low alpha so it shows on white and on a grey panel.
const STYLES: Record<DepositStatus, string> = {
  REQUESTED: "border border-ink/20 text-graphite",
  HELD: "border border-ink text-ink",
  RELEASED: "bg-ink text-paper",
  FORFEITED: "bg-ink/10 text-stone",
};

export function DepositStatusBadge({ status }: { status: DepositStatus }) {
  return (
    <span className={`text-xs rounded-full px-2.5 py-1 whitespace-nowrap font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
