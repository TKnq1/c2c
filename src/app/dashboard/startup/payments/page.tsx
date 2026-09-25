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
import {
  DEPOSITS_ENABLED,
  PLATFORM_FEE_RATE,
  PRO_PLATFORM_FEE_RATE,
  PRO_SUBSCRIPTION_PRICE_CENTS,
  RELEASE_REVIEW_DAYS,
  RELEASE_REVIEW_MS,
} from "@/lib/constants";

const primaryButton =
  "rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700";
const quietButton = "text-xs text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400";

export default async function StartupPaymentsPage(props: PageProps<"/dashboard/startup/payments">) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

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

  return (
    <div className="flex flex-col gap-8">
      <CheckoutReturn status={checkout} waiting={confirmingId !== null} />
      <PaymentStats
        stats={[
          { label: "Spent", value: formatCents(totalSpentCents), hint: "Refunds not counted" },
          { label: "In escrow", value: formatCents(inEscrowCents), hint: "Until you approve" },
        ]}
        counts={[
          { label: "Completed", value: String(completedCount) },
          { label: "In progress", value: String(inProgressCount) },
          { label: "Rating", value: averageRating === null ? "–" : `${averageRating.toFixed(1)} ★` },
        ]}
        footnote={
          creatorsWorkedWith > 0 && (
            <>
              {creatorsWorkedWith} creator{creatorsWorkedWith === 1 ? "" : "s"} worked with
              {bestRequest && (
                <>
                  {" · "}Top request: <span className="font-medium text-ink">{bestRequest.title}</span> (
                  {formatCents(bestRequest.totalCents)})
                </>
              )}
            </>
          )
        }
      />

      <div className="flex items-center justify-between gap-3 rounded-[20px] bg-fog px-4 py-3 no-print">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {startup.isPro
            ? `Pro plan — ${PRO_PLATFORM_FEE_RATE * 100}% fee per payment instead of ${PLATFORM_FEE_RATE * 100}%.`
            : `${PLATFORM_FEE_RATE * 100}% fee per payment. Pro lowers it to ${PRO_PLATFORM_FEE_RATE * 100}% for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month.`}
        </p>
        <Link
          href="/dashboard/startup/settings#plan"
          className={
            startup.isPro
              ? "shrink-0 text-sm font-medium underline"
              : "shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite"
          }
        >
          {startup.isPro ? "Manage" : "Go Pro"}
        </Link>
      </div>

      {allInterests.length === 0 && (
        <EmptyState
          icon={IoCardOutline}
          title="No payments yet"
          description="Once creators are interested in one of your requests, you can send them an offer here or right in your chat with them."
          action={{ label: "Post a request", href: "/dashboard/startup/new" }}
        />
      )}

      {toApprove.length > 0 && (
        <PaymentSection title="To approve" count={toApprove.length} className="no-print">
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
                    {creator} submitted their post.{" "}
                    <a href={p.proofUrl!} target="_blank" rel="noopener noreferrer" className="underline">
                      Check the post
                    </a>
                    , then approve it or report a problem by{" "}
                    <LocalDate ms={p.proofSubmittedAt!.getTime() + RELEASE_REVIEW_MS} /> — after that it&apos;s released
                    to them automatically.
                  </>
                }
                meta={
                  <>
                    Paid <LocalDate ms={p.paidAt!.getTime()} />
                    {" · "}Posted <LocalDate ms={p.proofSubmittedAt!.getTime()} />
                  </>
                }
              >
                <PaymentApprovalButtons
                  interestId={p.id}
                  creatorName={creator}
                  payoutLabel={`${formatCents(p.payoutCents!)} (after the ${feePercentOf(p)}% fee)`}
                />
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}

      {pendingOffers.length > 0 && (
        <PaymentSection title="Offers" count={pendingOffers.length} className="no-print">
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
                    ? `Waiting for ${creator} — they'd get ${formatCents(i.payoutCents!)} after the ${feePercentOf(i)}% fee.`
                    : `${creator} countered — they'd get ${formatCents(i.payoutCents!)} after the ${feePercentOf(i)}% fee.`
                }
              >
                {mine ? (
                  <div className="mt-2">
                    <ActionButton
                      action={withdrawOfferAction.bind(null, i.id)}
                      successMessage="Offer withdrawn."
                      className={quietButton}
                    >
                      Withdraw offer
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
        <PaymentSection title="To pay" count={awaitingPayment.length} className="no-print">
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
                  ? "Payment received — confirming with Stripe. This takes a few seconds."
                  : `Accepted — it's held in escrow until ${i.creator.displayName} posts and you approve it. They get ${formatCents(i.payoutCents!)} after the ${feePercentOf(i)}% fee.`
              }
            >
              {i.id !== confirmingId && (
                <CompletePaymentButton interestId={i.id} label={`Pay ${formatCents(i.amountCents!)}`} />
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
        <PaymentSection title="Interested creators" count={interested.length} className="no-print">
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
          title="Payments"
          count={history.length}
          action={
            <div className="flex shrink-0 items-center gap-2 no-print">
              <a
                href="/api/payments/export"
                aria-label="Export as CSV"
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
                      `Held until ${creator} posts and submits the link — then you have ${RELEASE_REVIEW_DAYS} days to approve it. They get ${formatCents(p.payoutCents!)} after the ${feePercentOf(p)}% fee.`}
                    {stage === "DISPUTED" &&
                      `You reported a problem: “${p.disputeReason}” The payment is on hold while we look into it — we'll get back to you both.`}
                    {stage === "RELEASED" &&
                      `${creator} received ${formatCents(p.payoutCents!)} after the ${feePercentOf(p)}% fee (${formatCents(p.platformFeeCents!)}).`}
                    {stage === "REFUNDED" && "Cancelled — the full amount was refunded to you."}
                    {(stage === "DISPUTED" || stage === "RELEASED") && p.proofUrl && (
                      <>
                        {" "}
                        <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          View post
                        </a>
                      </>
                    )}
                  </>
                }
                meta={
                  <>
                    Paid <LocalDate ms={p.paidAt!.getTime()} />
                    {p.proofSubmittedAt && (
                      <>
                        {" · "}Posted <LocalDate ms={p.proofSubmittedAt.getTime()} />
                      </>
                    )}
                    {p.releasedAt && (
                      <>
                        {" · "}Released <LocalDate ms={p.releasedAt.getTime()} />
                      </>
                    )}
                    {p.refundedAt && (
                      <>
                        {" · "}Refunded <LocalDate ms={p.refundedAt.getTime()} />
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
                      successMessage="Payment refunded."
                      title="Cancel and refund?"
                      description={`${formatCents(p.amountCents!)} goes back to you and ${creator} won't be paid for this collab. Only do this if they never delivered — it can't be undone.`}
                      confirmLabel={`Refund ${formatCents(p.amountCents!)}`}
                      pendingLabel="Refunding…"
                      className={quietButton}
                    >
                      Creator never delivered? Cancel &amp; refund
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
          title="Deposits"
          count={deposits.length}
          description="Refundable, no fee — return it once the post is live, or keep it if the creator never delivers."
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
                    {d.depositStatus === "REQUESTED" && `Waiting for ${creator} to pay it.`}
                    {d.depositStatus === "HELD" && `Held — return it once ${creator}'s post is live.`}
                    {d.depositStatus === "RELEASED" && `Returned to ${creator}.`}
                    {d.depositStatus === "FORFEITED" && `Kept — ${creator} didn't deliver.`}
                  </>
                }
                meta={
                  <>
                    Requested <LocalDate ms={d.depositRequestedAt!.getTime()} />
                    {d.depositPaidAt && (
                      <>
                        {" · "}Paid <LocalDate ms={d.depositPaidAt.getTime()} />
                      </>
                    )}
                    {d.depositReleasedAt && (
                      <>
                        {" · "}Returned <LocalDate ms={d.depositReleasedAt.getTime()} />
                      </>
                    )}
                    {d.depositForfeitedAt && (
                      <>
                        {" · "}Kept <LocalDate ms={d.depositForfeitedAt.getTime()} />
                      </>
                    )}
                  </>
                }
              >
                {d.depositStatus === "HELD" && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 no-print">
                    <ActionButton
                      action={releaseDepositAction.bind(null, d.id)}
                      successMessage="Deposit returned."
                      pendingChildren="Returning…"
                      className={primaryButton}
                    >
                      Return deposit
                    </ActionButton>
                    <ConfirmActionButton
                      action={forfeitDepositAction.bind(null, d.id)}
                      successMessage="Deposit kept."
                      title="Keep the deposit?"
                      description={`${creator} won't get their ${formatCents(d.depositCents!)} back. Only do this if they never delivered — it can't be undone.`}
                      confirmLabel={`Keep ${formatCents(d.depositCents!)}`}
                      pendingLabel="Keeping…"
                      className={quietButton}
                    >
                      Creator never delivered? Keep deposit
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
