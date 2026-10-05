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
import { useI18n } from "@/components/i18n-provider";
import { PaymentApprovalButtons } from "@/components/payment-approval";
import { SubmitPostButton } from "@/components/submit-post";
import { Spinner } from "@/components/spinner";
import { formatCents } from "@/lib/format";
import { RELEASE_REVIEW_MS } from "@/lib/constants";

export type ChatOfferTurn = {
  id: string;
  at: number;
  isMine: boolean;
  isCounter: boolean;
  amountCents: number;
  outcome: "SUPERSEDED" | "DECLINED" | "WITHDRAWN";
  otherPartyName: string;
};

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
  // True when this proposal replaced an earlier one. The first amount in a
  // thread is an offer; everything after it is a counter-offer.
  isCounter?: boolean;
};

const primaryButton =
  "flex-1 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50";
const secondaryButton =
  "flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 disabled:opacity-50 dark:border-neutral-700";
const quietButton =
  "text-xs text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400";
// Accept stays solid while it works; the spinner inside says it's busy.
const acceptButton =
  "flex-1 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite disabled:cursor-wait";
const pillButton =
  "inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700";

// A proposal that is no longer the one on the table: countered, declined,
// or withdrawn. It stays in the thread, on the side of whoever made it,
// so the negotiation reads top to bottom instead of only the latest amount.
export function OfferHistoryCard({ turn, timeLabel, isNew }: { turn: ChatOfferTurn; timeLabel: string; isNew: boolean }) {
  const { t } = useI18n();
  const eyebrow = turn.isMine
    ? t(turn.isCounter ? "screens.payments.copy.yourCounter" : "screens.payments.copy.yourOffer")
    : t(turn.isCounter ? "screens.payments.copy.theirCounter" : "screens.payments.copy.theirOffer", { name: turn.otherPartyName });
  const status =
    turn.outcome === "SUPERSEDED"
      ? t("screens.payments.copy.offerReplaced")
      : turn.outcome === "DECLINED"
        ? t("screens.payments.copy.offerWasDeclined")
        : t("screens.payments.copy.offerWasWithdrawn");

  return (
    <div
      className={`my-2 flex ${turn.isMine ? "origin-bottom-right justify-end" : "origin-bottom-left justify-start"} ${isNew ? "animate-bubble-in" : ""}`}
    >
      <div className="w-[80%] max-w-xs rounded-[18px] border border-ink/10 bg-fog px-3.5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{eyebrow}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-neutral-700 line-through decoration-neutral-500 dark:text-neutral-300 dark:decoration-neutral-400">
          {formatCents(turn.amountCents)}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{status}</span>
          {timeLabel && <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{timeLabel}</span>}
        </div>
      </div>
    </div>
  );
}

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
  variant = "bubble",
}: {
  interestId: string;
  offer: ChatOffer;
  timeLabel: string;
  isNew: boolean;
  // "panel": the same card, full width and in place, for the chat's info
  // column on wide screens (see ChatInfoPanel).
  variant?: "bubble" | "panel";
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const { t } = useI18n();
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
        eyebrow = t(offer.isCounter ? "screens.payments.copy.yourCounter" : "screens.payments.copy.yourOffer");
        detail = payout && (isBrand ? t("screens.payments.copy.wouldGet", { name: other, payout, fee }) : t("screens.payments.copy.youdGet", { payout, fee }));
        actions = (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("screens.payments.copy.waitingFor", { name: other })}</span>
            <ActionButton
              action={withdrawOfferAction.bind(null, interestId)}
              successMessage={t("screens.payments.copy.offerWithdrawn")}
              onSuccess={refresh}
              className={quietButton}
            >
              {t("screens.payments.copy.withdraw")}
            </ActionButton>
          </div>
        );
      } else {
        eyebrow = t(offer.isCounter ? "screens.payments.copy.theirCounter" : "screens.payments.copy.theirOffer", { name: other });
        detail = payout && (isBrand ? t("screens.payments.copy.wouldGet", { name: other, payout, fee }) : t("screens.payments.copy.youdGet", { payout, fee }));
        actions = <OfferResponseButtons interestId={interestId} otherPartyName={other} />;
      }
      break;

    case "ACCEPTED":
      eyebrow = t("screens.payments.copy.offerAccepted");
      if (isBrand) {
        detail = t("screens.payments.copy.payThroughStripe", { name: other });
        actions = (
          <CompletePaymentButton interestId={interestId} label={t("screens.payments.copy.payNow")} className={`${primaryButton} w-full`} />
        );
      } else {
        detail = t("screens.payments.copy.brandPaysNext", { name: other });
        // Live updates (ChatLiveUpdates) swap this for the paid card once the
        // payment lands.
        actions = (
          <p
            role="status"
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-fog px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400"
          >
            <Spinner />
            {t("screens.payments.waiting")}
          </p>
        );
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
            {t("screens.payments.copy.viewPost")}
          </a>
        </>
      );
      if (offer.disputed) {
        eyebrow = t("screens.payments.copy.underReview");
        detail = (
          <>
            {isBrand ? t("screens.payments.copy.youReportedShort") : t("screens.payments.copy.theyReportedShort", { name: other })}
            {t("screens.payments.copy.problemWithPost")}
            {viewPost}
          </>
        );
      } else if (offer.proofSubmittedAt !== null) {
        const deadline = offer.proofSubmittedAt + RELEASE_REVIEW_MS;
        eyebrow = t("screens.payments.copy.postSubmitted");
        if (isBrand) {
          detail = (
            <>
              {t("screens.payments.copy.checkThenApprove")}
              <LocalDate ms={deadline} />
              {t("screens.payments.copy.releasedAutoAfter")}
              {viewPost}
            </>
          );
          actions = (
            <PaymentApprovalButtons interestId={interestId} creatorName={other} payoutLabel={payout ?? t("screens.payments.copy.thePayment")} />
          );
        } else {
          detail = (
            <>
              {t("screens.payments.copy.waitingApproveElse", { name: other })}
              <LocalDate ms={deadline} />.{viewPost}
            </>
          );
        }
      } else {
        eyebrow = t("screens.payments.copy.paidHeld");
        if (isBrand) {
          detail = t("screens.payments.copy.releasedOnce", { name: other });
        } else if (offer.payoutsReady) {
          detail = t("screens.payments.copy.postThenLink", { payout: payout ?? t("screens.payments.copy.paidWord"), name: other });
          actions = (
            <SubmitPostButton
              interestId={interestId}
              brandName={other}
              label={t("screens.payments.copy.submitPostLink")}
              className={`${primaryButton} mt-3 w-full`}
            />
          );
        } else {
          detail = t("screens.payments.copy.setupThenSubmit", { payout: payout ?? t("screens.payments.copy.paidWord") });
        }
      }
      break;
    }

    case "RELEASED":
      eyebrow = t("screens.payments.copy.paymentReleased");
      detail = payout && (isBrand ? t("screens.payments.copy.theyReceived", { name: other, payout }) : t("screens.payments.copy.youReceivedShort", { payout }));
      break;

    case "REFUNDED":
      eyebrow = t("screens.payments.refunded");
      detail = isBrand ? t("screens.payments.copy.fullBackYou") : t("screens.payments.copy.fullBackThem", { name: other });
      break;
  }

  const panel = variant === "panel";
  return (
    <div
      className={
        panel
          ? ""
          : `my-2 flex ${isMine ? "origin-bottom-right justify-end" : "origin-bottom-left justify-start"} ${isNew ? "animate-bubble-in" : ""}`
      }
    >
      <div
        className={
          panel ? "rounded bg-background p-3.5" : "w-[80%] max-w-xs rounded-[18px] border border-ink/10 bg-background p-3.5 shadow-sm"
        }
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {eyebrow}
        </p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{formatCents(offer.amountCents)}</p>
        {detail && <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{detail}</p>}
        {actions}
        <div className="mt-2 flex items-center justify-between gap-2">
          {offer.status !== "OFFERED" ? (
            <Link href={offer.paymentsHref} className="text-xs text-neutral-500 hover:underline dark:text-neutral-400">
              {t("screens.payments.copy.viewInPayments")}
            </Link>
          ) : (
            <span />
          )}
          {timeLabel && <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{timeLabel}</span>}
        </div>
      </div>
    </div>
  );
}

// Accept / Counter / Decline for an offer that's waiting on the viewer —
// the same three wherever an offer can be answered: its card in the chat,
// and its row in Payments.
export function OfferResponseButtons({ interestId, otherPartyName }: { interestId: string; otherPartyName: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [counterOpen, setCounterOpen] = useState(false);

  return (
    <>
      <div className="mt-3 flex gap-2">
        <ActionButton
          action={acceptOfferAction.bind(null, interestId)}
          successMessage={t("screens.payments.copy.offerAcceptedToast")}
          onSuccess={() => router.refresh()}
          className={acceptButton}
          pendingChildren={
            // Same width as the label, so the button doesn't jump.
            <span className="relative inline-flex items-center justify-center">
              <span className="invisible">{t("screens.payments.copy.accept")}</span>
              <Spinner className="absolute h-4 w-4" />
              <span className="sr-only">{t("screens.payments.copy.accepting")}</span>
            </span>
          }
        >
          {t("screens.payments.copy.accept")}
        </ActionButton>
        <button type="button" onClick={() => setCounterOpen(true)} className={secondaryButton}>
          {t("screens.payments.copy.counter")}
        </button>
      </div>
      <div className="mt-2 flex justify-center">
        <ConfirmActionButton
          action={declineOfferAction.bind(null, interestId)}
          successMessage={t("screens.payments.copy.offerDeclined")}
          title={t("screens.payments.copy.declineTitle")}
          description={t("screens.payments.copy.declineBody", { name: otherPartyName })}
          confirmLabel={t("screens.payments.copy.declineOffer")}
          pendingLabel={t("screens.payments.copy.declining")}
          className={quietButton}
        >
          {t("screens.payments.copy.decline")}
        </ConfirmActionButton>
      </div>
      <Dialog open={counterOpen} onClose={() => setCounterOpen(false)} title={t("screens.payments.copy.counterTitle")}>
        <AmountForm
          action={counterOfferAction.bind(null, interestId)}
          hint={t("screens.payments.copy.counterHint", { name: otherPartyName })}
          submitLabel={t("screens.payments.copy.sendCounter")}
          successMessage={t("screens.payments.copy.counterSent")}
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
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <IoPricetagOutline className="h-4 w-4" />
        {t("screens.payments.copy.makeOffer")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("screens.payments.copy.makeOffer")}>
        <AmountForm
          action={sendOfferAction.bind(null, interestId)}
          hint={t("screens.payments.copy.makeOfferHint", { fee: feeRatePercent })}
          submitLabel={t("screens.payments.copy.sendOffer")}
          successMessage={t("screens.payments.copy.offerSent")}
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
