"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaymentStatus, Role } from "@prisma/client";
import { IoPricetagOutline } from "react-icons/io5";
import {
  acceptOfferAction,
  counterOfferAction,
  declineOfferAction,
  sendOfferAction,
  withdrawOfferAction,
} from "@/lib/actions/payments";
import { ActionButton } from "@/components/action-button";
import { AmountForm } from "@/components/amount-form";
import { CompletePaymentButton } from "@/components/complete-payment-button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Dialog } from "@/components/dialog";
import { LocalDate } from "@/components/local-date";
import { PaymentApprovalButtons } from "@/components/payment-approval";
import { SubmitPostButton } from "@/components/submit-post";
import { formatCents } from "@/lib/format";
import { RELEASE_REVIEW_MS } from "@/lib/constants";

export type ChatOffer = {
  at: number;
  status: PaymentStatus;
  offerRole: Role | null;
  amountCents: number;
  payoutCents: number | null;
  viewerRole: Role;
  otherPartyName: string;
  paymentsHref: string;
  feeRatePercent: number;
  // The approval step while the money is HELD (see paymentStage).
  proofUrl: string | null;
  proofSubmittedAt: number | null;
  disputed: boolean;
  // Creator side only: whether payouts are set up, which submitting a post needs.
  payoutsReady: boolean;
};

const primaryButton =
  "flex-1 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50";
const secondaryButton =
  "flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 disabled:opacity-50 dark:border-neutral-700";
const quietButton =
  "text-xs text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400";
const pillButton =
  "inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700";

// The current offer as a card in the conversation itself — the way Vinted
// shows one — instead of a panel pinned above it. It sits on the side of
// whoever made the latest proposal, updates in place as the offer moves
// from proposed to accepted to paid, and carries that stage's actions
// right there. The server re-checks every rule (who may accept, counter,
// withdraw, pay); this only decides which buttons to offer.
export function ChatOfferCard({
  interestId,
  offer,
  timeLabel,
  isNew,
}: {
  interestId: string;
  offer: ChatOffer;
  timeLabel: string;
  isNew: boolean;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const other = offer.otherPartyName;
  const isMine = offer.offerRole === offer.viewerRole;
  const isBrand = offer.viewerRole === "STARTUP";
  const payout = offer.payoutCents !== null ? formatCents(offer.payoutCents) : null;
  const fee = `${offer.feeRatePercent}%`;

  let eyebrow: string;
  let detail: React.ReactNode = null;
  let actions: React.ReactNode = null;

  switch (offer.status) {
    case "OFFERED":
      if (isMine) {
        eyebrow = "Your offer";
        detail = payout && (isBrand ? `${other} would get ${payout} after the ${fee} fee.` : `You'd get ${payout} after the ${fee} fee.`);
        actions = (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Waiting for {other}</span>
            <ActionButton
              action={withdrawOfferAction.bind(null, interestId)}
              successMessage="Offer withdrawn."
              onSuccess={refresh}
              className={quietButton}
            >
              Withdraw
            </ActionButton>
          </div>
        );
      } else {
        eyebrow = `${other}'s offer`;
        detail = payout && (isBrand ? `${other} would get ${payout} after the ${fee} fee.` : `You'd get ${payout} after the ${fee} fee.`);
        actions = <OfferResponseButtons interestId={interestId} otherPartyName={other} />;
      }
      break;

    case "ACCEPTED":
      eyebrow = "Offer accepted";
      if (isBrand) {
        detail = `Pay through Stripe — it's held in escrow until ${other} posts and you approve it.`;
        actions = (
          <CompletePaymentButton interestId={interestId} label="Pay now" className={`${primaryButton} w-full`} />
        );
      } else {
        detail = `Waiting for ${other} to pay.`;
      }
      break;

    case "HELD": {
      // Three steps inside HELD: waiting for the post, waiting for the
      // brand's approval (with its automatic-release date), or on hold
      // after a reported problem. See paymentStage.
      const viewPost = offer.proofUrl && (
        <>
          {" "}
          <a href={offer.proofUrl} target="_blank" rel="noopener noreferrer" className="underline">
            View post
          </a>
        </>
      );
      if (offer.disputed) {
        eyebrow = "Under review";
        detail = (
          <>
            {isBrand ? "You reported a problem" : `${other} reported a problem`} with the post — the payment is on hold
            while we look into it.{viewPost}
          </>
        );
      } else if (offer.proofSubmittedAt !== null) {
        const deadline = offer.proofSubmittedAt + RELEASE_REVIEW_MS;
        eyebrow = "Post submitted";
        if (isBrand) {
          detail = (
            <>
              Check the post, then approve it or report a problem by <LocalDate ms={deadline} /> — after that
              it&apos;s released automatically.{viewPost}
            </>
          );
          actions = (
            <PaymentApprovalButtons interestId={interestId} creatorName={other} payoutLabel={payout ?? "the payment"} />
          );
        } else {
          detail = (
            <>
              Waiting for {other} to approve it — otherwise it&apos;s released to you automatically on{" "}
              <LocalDate ms={deadline} />.{viewPost}
            </>
          );
        }
      } else {
        eyebrow = "Paid · held in escrow";
        if (isBrand) {
          detail = `Released to ${other} once they post and you approve it.`;
        } else if (offer.payoutsReady) {
          detail = `Post the content, then submit the link — you get ${payout ?? "paid"} once ${other} approves it.`;
          actions = (
            <SubmitPostButton
              interestId={interestId}
              brandName={other}
              label="Submit post link"
              className={`${primaryButton} mt-3 w-full`}
            />
          );
        } else {
          detail = `Set up payouts in Payments, then submit the link to your post to get ${payout ?? "paid"}.`;
        }
      }
      break;
    }

    case "RELEASED":
      eyebrow = "Payment released";
      detail = payout && (isBrand ? `${other} received ${payout}.` : `You received ${payout}.`);
      break;

    case "REFUNDED":
      eyebrow = "Refunded";
      detail = isBrand ? "The full amount went back to you." : `The full amount went back to ${other}.`;
      break;
  }

  return (
    <div
      className={`my-2 flex ${isMine ? "origin-bottom-right justify-end" : "origin-bottom-left justify-start"} ${
        isNew ? "animate-bubble-in" : ""
      }`}
    >
      <div className="w-[80%] max-w-xs rounded-[18px] border border-ink/10 bg-background p-3.5 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {eyebrow}
        </p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{formatCents(offer.amountCents)}</p>
        {detail && <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{detail}</p>}
        {actions}
        <div className="mt-2 flex items-center justify-between gap-2">
          {offer.status !== "OFFERED" ? (
            <Link href={offer.paymentsHref} className="text-xs text-neutral-500 hover:underline dark:text-neutral-400">
              View in Payments →
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{timeLabel}</span>
        </div>
      </div>
    </div>
  );
}

// Accept / Counter / Decline for an offer that's waiting on the viewer —
// the same three wherever an offer can be answered: its card in the chat,
// and its row in Payments.
export function OfferResponseButtons({ interestId, otherPartyName }: { interestId: string; otherPartyName: string }) {
  const router = useRouter();
  const [counterOpen, setCounterOpen] = useState(false);

  return (
    <>
      <div className="mt-3 flex gap-2">
        <ActionButton
          action={acceptOfferAction.bind(null, interestId)}
          successMessage="Offer accepted."
          onSuccess={() => router.refresh()}
          className={primaryButton}
        >
          Accept
        </ActionButton>
        <button type="button" onClick={() => setCounterOpen(true)} className={secondaryButton}>
          Counter
        </button>
      </div>
      <div className="mt-2 flex justify-center">
        <ConfirmActionButton
          action={declineOfferAction.bind(null, interestId)}
          successMessage="Offer declined."
          title="Decline this offer?"
          description={`${otherPartyName} will be told you declined, and the offer is cleared so a new one can be made.`}
          confirmLabel="Decline offer"
          pendingLabel="Declining…"
          className={quietButton}
        >
          Decline
        </ConfirmActionButton>
      </div>
      <Dialog open={counterOpen} onClose={() => setCounterOpen(false)} title="Counter-offer">
        <AmountForm
          action={counterOfferAction.bind(null, interestId)}
          hint={`Propose a different amount — ${otherPartyName} can accept it, decline it, or counter again.`}
          submitLabel="Send counter-offer"
          successMessage="Counter-offer sent."
          onDone={() => setCounterOpen(false)}
        />
      </Dialog>
    </>
  );
}

// Brands only, and only while nothing is on the table yet — the same rule
// sendOfferAction enforces. Opens the amount sheet rather than a form
// wedged into the conversation.
export function MakeOfferButton({
  interestId,
  feeRatePercent,
  className = pillButton,
}: {
  interestId: string;
  feeRatePercent: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <IoPricetagOutline className="h-4 w-4" />
        Make an offer
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Make an offer">
        <AmountForm
          action={sendOfferAction.bind(null, interestId)}
          hint={`Paid through Stripe escrow: the creator accepts or declines first, and you only pay once they accept. The money is held until they mark the work as posted, then released minus our ${feeRatePercent}% platform fee.`}
          submitLabel="Send offer"
          successMessage="Offer sent."
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
