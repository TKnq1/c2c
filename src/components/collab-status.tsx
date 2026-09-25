import Link from "next/link";
import type { DepositStatus } from "@prisma/client";
import { PaymentStatusBadge, type PaymentStage } from "@/components/payment-status-badge";
import { DepositStatusBadge } from "@/components/deposit-status-badge";
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
  if (paymentStage === null && depositStatus === null) {
    return (
      <Link href={paymentsHref} className="text-xs text-neutral-500 hover:underline mt-2 inline-block dark:text-neutral-400">
        No offer sent yet — send one
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
            {paymentStage === "OFFERED" && `${amount} offered — awaiting response`}
            {paymentStage === "ACCEPTED" && (
              <>
                {amount} accepted · {actionLink("Pay to hold it in escrow")}
              </>
            )}
            {paymentStage === "HELD" &&
              `${amount} paid · ${payoutCents !== null ? formatCents(payoutCents) : ""} to creator once they post and you approve`}
            {paymentStage === "SUBMITTED" && (
              <>
                {amount} paid · post submitted — {actionLink("approve it")}
              </>
            )}
            {paymentStage === "DISPUTED" && `${amount} paid · on hold while we review the problem you reported`}
            {paymentStage === "RELEASED" && (
              <>
                {amount} paid
                {!hasReview && <> · {actionLink("Leave a review")}</>}
              </>
            )}
            {paymentStage === "REFUNDED" && `${amount} refunded to you`}
          </span>
        </div>
      )}
      {depositStatus !== null && (
        <div className="flex items-center gap-2 text-xs">
          <DepositStatusBadge status={depositStatus} />
          <span className="text-neutral-500 dark:text-neutral-400">{formatCents(depositCents!)} deposit</span>
        </div>
      )}
    </div>
  );
}
