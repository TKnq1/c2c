import Link from "next/link";
import { redirect } from "next/navigation";
import { IoCardOutline, IoDownloadOutline } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatLink, PaymentRow, PaymentSection, PaymentStats } from "@/components/payment-row";
import { CheckoutReturn } from "@/components/checkout-return";
import { PaymentStatusBadge, paymentStage } from "@/components/payment-status-badge";
import { DepositStatusBadge } from "@/components/deposit-status-badge";
import { ReviewForm } from "@/components/review-form";
import { PrintButton } from "@/components/print-button";
import { ActionButton } from "@/components/action-button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { CompletePaymentButton } from "@/components/complete-payment-button";
import { MakeOfferButton, OfferResponseButtons } from "@/components/chat-offer";
import { PaymentApprovalButtons } from "@/components/payment-approval";
import { RequestDepositButton } from "@/components/request-deposit-button";
import { LocalDate } from "@/components/local-date";
import { EmptyState } from "@/components/empty-state";
import { refundPaymentAction, withdrawOfferAction } from "@/lib/actions/payments";
import { releaseDepositAction, forfeitDepositAction } from "@/lib/actions/deposits";
import { formatCents } from "@/lib/format";
import { canSellProSubscription } from "@/lib/native-app-server";
import {
  DEPOSITS_ENABLED,
  PLATFORM_FEE_RATE,
  PRO_PLATFORM_FEE_RATE,
  PRO_SUBSCRIPTION_PRICE_CENTS,
  RELEASE_REVIEW_DAYS,
  RELEASE_REVIEW_MS,
} from "@/lib/constants";
import { PageTitle } from "@/components/page-title";
import { getT } from "@/lib/i18n/server";

const primaryButton =
  "rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700";
const quietButton = "text-xs text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400";

export default async function StartupPaymentsPage(props: PageProps<"/dashboard/startup/payments">) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");
  const t = await getT();

  // Set by Stripe Checkout's return URLs — see createCheckoutSessionAction.
  const searchParams = await props.searchParams;
  const checkout = Array.isArray(searchParams.checkout) ? searchParams.checkout[0] : searchParams.checkout;
  const paidInterestId = Array.isArray(searchParams.interest) ? searchParams.interest[0] : searchParams.interest;

  // One round-trip instead of two — filtered through the startup relation
  // rather than startup.id, so this doesn't have to wait on the fetch below
  // to know what to ask for. Also one query instead of six sequential ones
  // for allInterests: the lists below are all just different
  // filtered/sorted views over the same startup's interests, so it's
  // cheaper to fetch them all once and split/sort in JS than to round-trip
  // to Neon once per list for the same underlying rows.
  const [startup, allInterests] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.interest.findMany({
      where: { request: { startup: { userId: session.user.id } } },
      // Both sides' reviews: the brand's own prefills its review form, the
      // creators' make up the rating in the summary.
      include: { request: true, creator: true, reviews: true },
    }),
  ]);
  const byDesc = <T,>(key: (i: T) => Date | null) => (a: T, b: T) => (key(b)?.getTime() ?? 0) - (key(a)?.getTime() ?? 0);

  const payments = allInterests
    .filter((i) => i.paymentStatus === "HELD" || i.paymentStatus === "RELEASED" || i.paymentStatus === "REFUNDED")
    .sort(byDesc((i) => i.paidAt));
  // Posts waiting on this brand's approval get their own section at the
  // top — they run on a deadline, after which they're released without
  // anyone having looked. Soonest deadline first.
  const toApprove = payments
    .filter((p) => p.paymentStatus === "HELD" && p.proofSubmittedAt && !p.disputedAt)
    .sort((a, b) => a.proofSubmittedAt!.getTime() - b.proofSubmittedAt!.getTime());
  const history = payments.filter((p) => !toApprove.includes(p));
  const interested = allInterests.filter((i) => i.paymentStatus === null).sort(byDesc((i) => i.createdAt));
  const pendingOffers = allInterests.filter((i) => i.paymentStatus === "OFFERED").sort(byDesc((i) => i.offeredAt));
  const awaitingPayment = allInterests.filter((i) => i.paymentStatus === "ACCEPTED").sort(byDesc((i) => i.acceptedAt));
  const deposits = DEPOSITS_ENABLED
    ? allInterests.filter((i) => i.depositStatus !== null).sort(byDesc((i) => i.depositRequestedAt))
    : [];
  // Paid on Stripe, but the webhook that moves it into escrow hasn't landed
  // yet — that row says so instead of offering "Pay" a second time.
  const confirmingId =
    checkout === "success" && awaitingPayment.some((i) => i.id === paidInterestId) ? paidInterestId : null;

  // Refunded money came back, so it no longer counts as "spent".
  const totalSpentCents = payments
    .filter((p) => p.paymentStatus !== "REFUNDED")
    .reduce((sum, p) => sum + p.amountCents!, 0);
  const inEscrowCents = payments
    .filter((p) => p.paymentStatus === "HELD")
    .reduce((sum, p) => sum + p.amountCents!, 0);
  // Same definition Discover uses: a released payment is a finished collab.
  const completedCount = payments.filter((p) => p.paymentStatus === "RELEASED").length;
  const inProgressCount = allInterests.filter(
    (i) => i.paymentStatus === "OFFERED" || i.paymentStatus === "ACCEPTED" || i.paymentStatus === "HELD",
  ).length;
  const ratings = allInterests.flatMap((i) => i.reviews.filter((r) => r.authorRole === "CREATOR").map((r) => r.rating));
  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
  const creatorsWorkedWith = new Set([...payments.map((p) => p.creatorId), ...deposits.map((d) => d.creatorId)]).size;
  const spendByRequest = new Map<string, { title: string; totalCents: number }>();
  for (const p of payments) {
    if (p.paymentStatus === "REFUNDED") continue;
    const existing = spendByRequest.get(p.requestId);
    spendByRequest.set(p.requestId, {
      title: p.request.title,
      totalCents: (existing?.totalCents ?? 0) + p.amountCents!,
    });
  }
  const [bestRequest] = [...spendByRequest.values()].sort((a, b) => b.totalCents - a.totalCents);
  const feeRatePercent = (startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100;
  // The rate a given payment was actually charged at — it's stored per
  // payment, so a brand going Pro later doesn't rewrite older ones.
  const feePercentOf = (i: { platformFeeCents: number | null; amountCents: number | null }) =>
    Math.round((i.platformFeeCents! / i.amountCents!) * 100);

  const requestHref = (requestId: string) => `/dashboard/startup/requests/${requestId}`;
  // No Pro upsell in the store apps, see canSellProSubscription.
  const showProOffer = !startup.isPro && (await canSellProSubscription());

  return (
    <div className="page-wide flex flex-col gap-8">
      <PageTitle>{t("nav.payments")}</PageTitle>
      <CheckoutReturn status={checkout} waiting={confirmingId !== null} />
      <PaymentStats
        stats={[
          { label: t("screens.payments.spent"), value: formatCents(totalSpentCents), hint: t("screens.payments.refundsExcluded") },
          { label: t("screens.payments.inEscrow"), value: formatCents(inEscrowCents), hint: t("screens.payments.untilApprove") },
        ]}
        counts={[
          { label: t("screens.payments.completed"), value: String(completedCount) },
          { label: t("screens.payments.inProgress"), value: String(inProgressCount) },
          { label: t("screens.payments.rating"), value: averageRating === null ? "–" : `${averageRating.toFixed(1)} ★` },
        ]}
        footnote={
          creatorsWorkedWith > 0 && (
            <>
              {creatorsWorkedWith === 1
                ? t("screens.payments.creatorsWorked", { count: creatorsWorkedWith })
                : t("screens.payments.creatorsWorkedMany", { count: creatorsWorkedWith })}
              {bestRequest && (
                <>
                  {" · "}
                  {t("screens.payments.topRequest")}: <span className="font-medium text-ink">{bestRequest.title}</span> (
                  {formatCents(bestRequest.totalCents)})
                </>
              )}
            </>
          )
        }
      />

      <div className="flex items-center justify-between gap-3 rounded bg-fog px-4 py-3 no-print">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {startup.isPro
            ? t("screens.payments.proFeeLine", { pro: PRO_PLATFORM_FEE_RATE * 100, standard: PLATFORM_FEE_RATE * 100 })
            : showProOffer
              ? t("screens.payments.proOfferLine", {
                  standard: PLATFORM_FEE_RATE * 100,
                  pro: PRO_PLATFORM_FEE_RATE * 100,
                  price: formatCents(PRO_SUBSCRIPTION_PRICE_CENTS),
                })
              : t("screens.payments.standardFeeLine", { rate: PLATFORM_FEE_RATE * 100 })}
        </p>
        {(startup.isPro || showProOffer) && (
          <Link
            href="/dashboard/startup/settings#plan"
            className={
              startup.isPro
                ? "shrink-0 text-sm font-medium underline"
                : "shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite"
            }
          >
            {startup.isPro ? t("screens.payments.manage") : t("screens.payments.goPro")}
          </Link>
        )}
      </div>

      {allInterests.length === 0 && (
        <EmptyState
          icon={IoCardOutline}
          title={t("screens.payments.noneBrand")}
          description={t("screens.payments.noneBrandBody")}
          action={{ label: t("screens.payments.postRequest"), href: "/dashboard/startup/new" }}
        />
      )}

      {toApprove.length > 0 && (
        <PaymentSection id="to-approve" title={t("screens.payments.toApprove")} count={toApprove.length} className="no-print">
          {toApprove.map((p) => {
            const creator = p.creator.displayName;
            return (
              <PaymentRow
                key={p.id}
                avatarUrl={p.creator.avatarUrl}
                name={creator}
                title={p.request.title}
                titleHref={requestHref(p.requestId)}
                headerAction={<ChatLink interestId={p.id} name={creator} />}
                badge={<PaymentStatusBadge status="SUBMITTED" />}
                amount={formatCents(p.amountCents!)}
                detail={
                  <>
                    {t("screens.payments.copy.submittedLead", { name: creator })}{" "}
                    <a href={p.proofUrl!} target="_blank" rel="noopener noreferrer" className="underline">
                      {t("screens.payments.copy.checkPost")}
                    </a>
                    {t("screens.payments.copy.thenApprove")}
                    <LocalDate ms={p.proofSubmittedAt!.getTime() + RELEASE_REVIEW_MS} />
                    {t("screens.payments.copy.thenAuto")}
                  </>
                }
                meta={
                  <>
                    {t("screens.payments.copy.paid")} <LocalDate ms={p.paidAt!.getTime()} />
                    {" · "}
                    {t("screens.payments.copy.posted")} <LocalDate ms={p.proofSubmittedAt!.getTime()} />
                  </>
                }
              >
                <PaymentApprovalButtons
                  interestId={p.id}
                  creatorName={creator}
                  payoutLabel={t("screens.payments.copy.afterFee", {
                    payout: formatCents(p.payoutCents!),
                    fee: feePercentOf(p),
                  })}
                />
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}

      {pendingOffers.length > 0 && (
        <PaymentSection id="offers" title={t("screens.payments.offers")} count={pendingOffers.length} className="no-print">
          {pendingOffers.map((i) => {
            const creator = i.creator.displayName;
            const mine = i.offerRole === "STARTUP";
            return (
              <PaymentRow
                key={i.id}
                avatarUrl={i.creator.avatarUrl}
                name={creator}
                title={i.request.title}
                titleHref={requestHref(i.requestId)}
                headerAction={<ChatLink interestId={i.id} name={creator} />}
                badge={<PaymentStatusBadge status="OFFERED" />}
                amount={formatCents(i.amountCents!)}
                detail={
                  mine
                    ? t("screens.payments.copy.waitingFee", {
                        name: creator,
                        payout: formatCents(i.payoutCents!),
                        fee: feePercentOf(i),
                      })
                    : t("screens.payments.copy.counteredFee", {
                        name: creator,
                        payout: formatCents(i.payoutCents!),
                        fee: feePercentOf(i),
                      })
                }
              >
                {mine ? (
                  <div className="mt-2">
                    <ActionButton
                      action={withdrawOfferAction.bind(null, i.id)}
                      successMessage={t("screens.payments.copy.offerWithdrawn")}
                      className={quietButton}
                    >
                      {t("screens.payments.copy.withdrawOffer")}
                    </ActionButton>
                  </div>
                ) : (
                  <OfferResponseButtons interestId={i.id} otherPartyName={creator} />
                )}
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}

      {awaitingPayment.length > 0 && (
        <PaymentSection id="to-pay" title={t("screens.payments.toPay")} count={awaitingPayment.length} className="no-print">
          {awaitingPayment.map((i) => (
            <PaymentRow
              key={i.id}
              avatarUrl={i.creator.avatarUrl}
              name={i.creator.displayName}
              title={i.request.title}
              titleHref={requestHref(i.requestId)}
              headerAction={<ChatLink interestId={i.id} name={i.creator.displayName} />}
              badge={<PaymentStatusBadge status="ACCEPTED" />}
              amount={formatCents(i.amountCents!)}
              detail={
                i.id === confirmingId
                  ? t("screens.payments.copy.confirmingStripe")
                  : t("screens.payments.copy.acceptedEscrow", {
                      name: i.creator.displayName,
                      payout: formatCents(i.payoutCents!),
                      fee: feePercentOf(i),
                    })
              }
            >
              {i.id !== confirmingId && (
                <CompletePaymentButton interestId={i.id} label={t("screens.payments.copy.payAmount", { amount: formatCents(i.amountCents!) })} />
              )}
              {DEPOSITS_ENABLED && i.depositStatus === null && (
                <div className="mt-3">
                  <RequestDepositButton interestId={i.id} />
                </div>
              )}
            </PaymentRow>
          ))}
        </PaymentSection>
      )}

      {interested.length > 0 && (
        <PaymentSection id="interested" title={t("screens.payments.interested")} count={interested.length} className="no-print">
          {interested.map((i) => (
            <PaymentRow
              key={i.id}
              avatarUrl={i.creator.avatarUrl}
              name={i.creator.displayName}
              title={i.request.title}
              titleHref={requestHref(i.requestId)}
              headerAction={<ChatLink interestId={i.id} name={i.creator.displayName} />}
            >
              {/* Stacked full-width on phones — side by side, "Request
                  deposit" only had room to wrap onto two lines. */}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <MakeOfferButton
                  interestId={i.id}
                  feeRatePercent={feeRatePercent}
                  className={`${primaryButton} inline-flex items-center justify-center gap-1.5`}
                />
                {DEPOSITS_ENABLED && i.depositStatus === null && (
                  <RequestDepositButton interestId={i.id} className={secondaryButton} />
                )}
              </div>
            </PaymentRow>
          ))}
        </PaymentSection>
      )}

      {history.length > 0 && (
        <PaymentSection
          title={t("screens.payments.payments")}
          count={history.length}
          action={
            <div className="flex shrink-0 items-center gap-2 no-print">
              <a
                href="/api/payments/export"
                aria-label={t("screens.payments.copy.exportCsv")}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
              >
                <IoDownloadOutline className="h-4 w-4" />
                CSV
              </a>
              <PrintButton />
            </div>
          }
        >
          {history.map((p) => {
            const creator = p.creator.displayName;
            const myReview = p.reviews.find((r) => r.authorRole === "STARTUP");
            const stage = paymentStage({
              paymentStatus: p.paymentStatus!,
              proofSubmittedAt: p.proofSubmittedAt,
              disputedAt: p.disputedAt,
            });
            return (
              <PaymentRow
                key={p.id}
                avatarUrl={p.creator.avatarUrl}
                name={creator}
                title={p.request.title}
                titleHref={requestHref(p.requestId)}
                headerAction={<ChatLink interestId={p.id} name={creator} />}
                badge={<PaymentStatusBadge status={stage} />}
                amount={formatCents(p.amountCents!)}
                detail={
                  <>
                    {stage === "HELD" &&
                      t("screens.payments.copy.heldUntil", {
                        name: creator,
                        days: RELEASE_REVIEW_DAYS,
                        payout: formatCents(p.payoutCents!),
                        fee: feePercentOf(p),
                      })}
                    {stage === "DISPUTED" &&
                      t("screens.payments.copy.youReported", { reason: p.disputeReason ?? "" })}
                    {stage === "RELEASED" &&
                      t("screens.payments.copy.creatorReceived", {
                        name: creator,
                        payout: formatCents(p.payoutCents!),
                        fee: feePercentOf(p),
                        feeAmount: formatCents(p.platformFeeCents!),
                      })}
                    {stage === "REFUNDED" && t("screens.payments.copy.cancelledRefunded")}
                    {(stage === "DISPUTED" || stage === "RELEASED") && p.proofUrl && (
                      <>
                        {" "}
                        <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          {t("screens.payments.copy.viewPost")}
                        </a>
                      </>
                    )}
                  </>
                }
                meta={
                  <>
                    {t("screens.payments.copy.paid")} <LocalDate ms={p.paidAt!.getTime()} />
                    {p.proofSubmittedAt && (
                      <>
                        {" · "}
                        {t("screens.payments.copy.posted")} <LocalDate ms={p.proofSubmittedAt.getTime()} />
                      </>
                    )}
                    {p.releasedAt && (
                      <>
                        {" · "}
                        {t("screens.payments.copy.releasedOn")} <LocalDate ms={p.releasedAt.getTime()} />
                      </>
                    )}
                    {p.refundedAt && (
                      <>
                        {" · "}
                        {t("screens.payments.copy.refundedOn")} <LocalDate ms={p.refundedAt.getTime()} />
                      </>
                    )}
                  </>
                }
              >
                {stage === "HELD" && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 no-print">
                    {DEPOSITS_ENABLED && p.depositStatus === null && <RequestDepositButton interestId={p.id} />}
                    <ConfirmActionButton
                      action={refundPaymentAction.bind(null, p.id)}
                      successMessage={t("screens.payments.copy.paymentRefunded")}
                      title={t("screens.payments.copy.cancelRefundTitle")}
                      description={t("screens.payments.copy.cancelRefundBody", {
                        amount: formatCents(p.amountCents!),
                        name: creator,
                      })}
                      confirmLabel={t("screens.payments.copy.refundAmount", { amount: formatCents(p.amountCents!) })}
                      pendingLabel={t("screens.payments.copy.refunding")}
                      className={quietButton}
                    >
                      {t("screens.payments.copy.neverDeliveredRefund")}
                    </ConfirmActionButton>
                  </div>
                )}
                {stage === "RELEASED" && (
                  <ReviewForm
                    key={`${myReview?.rating}-${myReview?.comment}`}
                    interestId={p.id}
                    initial={myReview ? { rating: myReview.rating, comment: myReview.comment } : undefined}
                  />
                )}
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}

      {deposits.length > 0 && (
        <PaymentSection
          title={t("screens.payments.deposits")}
          count={deposits.length}
          description={t("screens.payments.copy.depositsHint")}
        >
          {deposits.map((d) => {
            const creator = d.creator.displayName;
            return (
              <PaymentRow
                key={d.id}
                avatarUrl={d.creator.avatarUrl}
                name={creator}
                title={d.request.title}
                titleHref={requestHref(d.requestId)}
                headerAction={<ChatLink interestId={d.id} name={creator} />}
                badge={<DepositStatusBadge status={d.depositStatus!} />}
                amount={formatCents(d.depositCents!)}
                detail={
                  <>
                    {d.depositStatus === "REQUESTED" && t("screens.payments.copy.depositWaiting", { name: creator })}
                    {d.depositStatus === "HELD" && t("screens.payments.copy.depositHeld", { name: creator })}
                    {d.depositStatus === "RELEASED" && t("screens.payments.copy.depositReturnedTo", { name: creator })}
                    {d.depositStatus === "FORFEITED" && t("screens.payments.copy.depositKeptBecause", { name: creator })}
                  </>
                }
                meta={
                  <>
                    {t("screens.payments.copy.requested")} <LocalDate ms={d.depositRequestedAt!.getTime()} />
                    {d.depositPaidAt && (
                      <>
                        {" · "}
                        {t("screens.payments.copy.paid")} <LocalDate ms={d.depositPaidAt.getTime()} />
                      </>
                    )}
                    {d.depositReleasedAt && (
                      <>
                        {" · "}
                        {t("screens.payments.copy.returned")} <LocalDate ms={d.depositReleasedAt.getTime()} />
                      </>
                    )}
                    {d.depositForfeitedAt && (
                      <>
                        {" · "}
                        {t("screens.payments.copy.kept")} <LocalDate ms={d.depositForfeitedAt.getTime()} />
                      </>
                    )}
                  </>
                }
              >
                {d.depositStatus === "HELD" && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 no-print">
                    <ActionButton
                      action={releaseDepositAction.bind(null, d.id)}
                      successMessage={t("screens.payments.copy.depositReturned")}
                      pendingChildren={t("screens.payments.copy.returning")}
                      className={primaryButton}
                    >
                      {t("screens.payments.copy.returnDeposit")}
                    </ActionButton>
                    <ConfirmActionButton
                      action={forfeitDepositAction.bind(null, d.id)}
                      successMessage={t("screens.payments.copy.depositKeptToast")}
                      title={t("screens.payments.copy.keepDepositTitle")}
                      description={t("screens.payments.copy.keepDepositBody", {
                        name: creator,
                        amount: formatCents(d.depositCents!),
                      })}
                      confirmLabel={t("screens.payments.copy.keepAmount", { amount: formatCents(d.depositCents!) })}
                      pendingLabel={t("screens.payments.copy.keeping")}
                      className={quietButton}
                    >
                      {t("screens.payments.copy.keepDeposit")}
                    </ConfirmActionButton>
                  </div>
                )}
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}
    </div>
  );
}
