"use client";

import { useState } from "react";
import Link from "next/link";
import type { PaymentStatus, Role } from "@prisma/client";
import { SendOfferForm } from "@/components/send-offer-form";
import { OfferResponseActions } from "@/components/offer-response-actions";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { ActionButton } from "@/components/action-button";
import { withdrawOfferAction } from "@/lib/actions/payments";
import { formatCents } from "@/lib/format";

// Pinned above the message feed so the offer/counter/accept back-and-forth
// can happen without leaving the conversation — the collab timeline in the
// feed below already shows this same state as read-only history. Release,
// refund, deposits, and reviews stay on the Payments page; this only covers
// the offer itself (send/accept/decline/counter/withdraw).
export function ChatOfferPanel({
  interestId,
  viewerRole,
  paymentStatus,
  offerRole,
  amountCents,
  payoutCents,
  otherPartyName,
  paymentsHref,
  feeRatePercent,
}: {
  interestId: string;
  viewerRole: Role;
  paymentStatus: PaymentStatus | null;
  offerRole: Role | null;
  amountCents: number | null;
  payoutCents: number | null;
  otherPartyName: string;
  paymentsHref: string;
  feeRatePercent: number;
}) {
  const [showOfferForm, setShowOfferForm] = useState(false);

  if (paymentStatus === null) {
    // Only brands initiate — nothing to show a creator here yet.
    if (viewerRole !== "STARTUP") return null;
    return (
      <div className="shrink-0 border-b border-ink/10 pb-3 mb-1">
        {showOfferForm ? (
          <SendOfferForm interestId={interestId} feeRatePercent={feeRatePercent} />
        ) : (
          <button
            type="button"
            onClick={() => setShowOfferForm(true)}
            className="text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
          >
            + Send an offer
          </button>
        )}
      </div>
    );
  }

  if (paymentStatus === "OFFERED") {
    const isMine = offerRole === viewerRole;
    return (
      <div className="shrink-0 border-b border-ink/10 pb-3 mb-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {isMine
              ? `You offered ${formatCents(amountCents!)} — awaiting ${otherPartyName}'s response.`
              : `${otherPartyName} offered ${formatCents(amountCents!)}.`}
          </p>
          <PaymentStatusBadge status="OFFERED" />
        </div>
        {isMine ? (
          <ActionButton
            action={withdrawOfferAction.bind(null, interestId)}
            successMessage="Offer withdrawn."
            className="text-xs text-neutral-400 hover:text-ink transition mt-2 disabled:opacity-50"
          >
            Withdraw offer
          </ActionButton>
        ) : (
          <OfferResponseActions interestId={interestId} />
        )}
      </div>
    );
  }

  // HELD / RELEASED / REFUNDED — a pinned readout; the release/refund/review
  // actions themselves live on the Payments page, linked below.
  const payoutLabel =
    viewerRole === "STARTUP" ? `${otherPartyName} receives ${formatCents(payoutCents!)}` : `you receive ${formatCents(payoutCents!)}`;

  return (
    <div className="shrink-0 border-b border-ink/10 pb-3 mb-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {formatCents(amountCents!)} total{paymentStatus !== "REFUNDED" && ` · ${payoutLabel}`}
        </p>
        <PaymentStatusBadge status={paymentStatus} />
      </div>
      <Link href={paymentsHref} className="text-xs text-neutral-500 hover:underline dark:text-neutral-400">
        View in Payments →
      </Link>
    </div>
  );
}
