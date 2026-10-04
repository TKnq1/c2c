"use client";

import type { DepositStatus } from "@prisma/client";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

const LABELS: Record<DepositStatus, MessageKey> = {
  REQUESTED: "screens.payments.copy.depositRequestedBadge",
  HELD: "screens.payments.copy.depositHeldBadge",
  RELEASED: "screens.payments.copy.depositReturnedBadge",
  FORFEITED: "screens.payments.copy.depositKeptBadge",
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
  const { t } = useI18n();
  return (
    <span className={`text-xs rounded-full px-2.5 py-1 whitespace-nowrap font-medium ${STYLES[status]}`}>
      {t(LABELS[status])}
    </span>
  );
}
