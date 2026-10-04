"use client";

import Link from "next/link";
import type { DepositStatus } from "@prisma/client";
import { PaymentStatusBadge, type PaymentStage } from "@/components/payment-status-badge";
import { DepositStatusBadge } from "@/components/deposit-status-badge";
import { useI18n } from "@/components/i18n-provider";
import { formatCents } from "@/lib/format";

type Props = {
  paymentStage: PaymentStage | null;
  amountCents: number | null;
  payoutCents: number | null;
  depositStatus: DepositStatus | null;
  depositCents: number | null;
  hasReview: boolean;
  paymentsHref: string;
};

// A same-page summary of where a specific interest stands on the two
// independent money tracks (payment, deposit) plus the review — otherwise
// only visible by cross-referencing this creator's name on the separate
// Payments page.
export function CollabStatus({
  paymentStage,
  amountCents,
  payoutCents,
  depositStatus,
  depositCents,
  hasReview,
  paymentsHref,
}: Props) {
  const { t } = useI18n();
  if (paymentStage === null && depositStatus === null) {
    return (
      <Link href={paymentsHref} className="text-xs text-neutral-500 hover:underline mt-2 inline-block dark:text-neutral-400">
        {t("screens.ui.noOfferYet")}
      </Link>
    );
  }

  const amount = amountCents !== null ? formatCents(amountCents) : "";
  const actionLink = (label: string) => (
    <Link href={paymentsHref} className="hover:underline">
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {paymentStage !== null && (
        <div className="flex items-center gap-2 text-xs">
          <PaymentStatusBadge status={paymentStage} />
          <span className="text-neutral-500 dark:text-neutral-400">
            {paymentStage === "OFFERED" && t("screens.ui.offeredAwaiting", { amount })}
            {paymentStage === "ACCEPTED" && (
              <>
                {t("screens.ui.accepted", { amount })} · {actionLink(t("screens.ui.payEscrow"))}
              </>
            )}
            {paymentStage === "HELD" &&
              t("screens.ui.heldUntil", { amount, payout: payoutCents !== null ? formatCents(payoutCents) : "" })}
            {paymentStage === "SUBMITTED" && (
              <>
                {t("screens.ui.paidSubmitted", { amount })} · {actionLink(t("screens.ui.approveIt"))}
              </>
            )}
            {paymentStage === "DISPUTED" && t("screens.ui.disputed", { amount })}
            {paymentStage === "RELEASED" && (
              <>
                {t("screens.ui.paid", { amount })}
                {!hasReview && <> · {actionLink(t("screens.ui.leaveReview"))}</>}
              </>
            )}
            {paymentStage === "REFUNDED" && t("screens.ui.refundedYou", { amount })}
          </span>
        </div>
      )}
      {depositStatus !== null && (
        <div className="flex items-center gap-2 text-xs">
          <DepositStatusBadge status={depositStatus} />
          <span className="text-neutral-500 dark:text-neutral-400">
            {t("screens.ui.depositWord", { amount: formatCents(depositCents!) })}
          </span>
        </div>
      )}
    </div>
  );
}
