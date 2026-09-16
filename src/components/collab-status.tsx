import Link from "next/link";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { DepositStatusBadge } from "@/components/deposit-status-badge";
import { formatCents } from "@/lib/format";

type Props = {
  paymentStatus: PaymentStatus | null;
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
  paymentStatus,
  amountCents,
  payoutCents,
  depositStatus,
  depositCents,
  hasReview,
  paymentsHref,
}: Props) {
  if (paymentStatus === null && depositStatus === null) {
    return (
      <Link href={paymentsHref} className="text-xs text-neutral-500 hover:underline mt-2 inline-block dark:text-neutral-400">
        No offer sent yet — send one
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {paymentStatus !== null && (
        <div className="flex items-center gap-2 text-xs">
          <PaymentStatusBadge status={paymentStatus} />
          <span className="text-neutral-500 dark:text-neutral-400">
            {paymentStatus === "OFFERED" && `${formatCents(amountCents!)} offered — awaiting response`}
            {paymentStatus !== "OFFERED" && (
              <>
                {formatCents(amountCents!)} paid
                {paymentStatus === "HELD" && ` · ${formatCents(payoutCents!)} to creator once released`}
                {paymentStatus === "RELEASED" && !hasReview && (
                  <>
                    {" · "}
                    <Link href={paymentsHref} className="hover:underline">
                      Leave a review
                    </Link>
                  </>
                )}
              </>
            )}
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
