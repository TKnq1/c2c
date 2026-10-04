import Link from "next/link";
import { redirect } from "next/navigation";
import { IoCardOutline, IoCheckmarkCircle, IoDownloadOutline, IoWalletOutline } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatLink, PaymentRow, PaymentSection, PaymentStats } from "@/components/payment-row";
import { PaymentStatusBadge, paymentStage } from "@/components/payment-status-badge";
import { DepositStatusBadge } from "@/components/deposit-status-badge";
import { ReviewForm } from "@/components/review-form";
import { PrintButton } from "@/components/print-button";
import { SubmitPostButton, SubmitPostForm } from "@/components/submit-post";
import { ConnectStripeButton } from "@/components/connect-stripe-button";
import { ActionButton } from "@/components/action-button";
import { OfferResponseButtons } from "@/components/chat-offer";
import { LocalDate } from "@/components/local-date";
import { EmptyState } from "@/components/empty-state";
import { payDepositAction } from "@/lib/actions/deposits";
import { withdrawOfferAction } from "@/lib/actions/payments";
import { formatCents, isWithinLastWeek } from "@/lib/format";
import { DEPOSITS_ENABLED, RELEASE_REVIEW_DAYS, RELEASE_REVIEW_MS } from "@/lib/constants";
import { PageTitle } from "@/components/page-title";
import { getT } from "@/lib/i18n/server";

const primaryButton =
  "mt-3 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto";
const quietButton = "text-xs text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400";
const pillLink =
  "inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700";

export default async function CreatorPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");
  const t = await getT();

  // One round-trip instead of two — filtered through the creator relation
  // rather than creator.id, so this doesn't have to wait on the fetch below
  // to know what to ask for. Also one query instead of four sequential ones
  // for the same reason the startup payments page's version is.
  const [creator, allInterests] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.interest.findMany({
      where: { creator: { userId: session.user.id } },
      // Both sides' reviews: the creator's own prefills their review form,
      // the brands' make up the rating in the summary.
      include: { request: { include: { startup: true } }, reviews: true },
    }),
  ]);
  const byDesc = <T,>(key: (i: T) => Date | null) => (a: T, b: T) => (key(b)?.getTime() ?? 0) - (key(a)?.getTime() ?? 0);

  const payments = allInterests
    .filter((i) => i.paymentStatus === "HELD" || i.paymentStatus === "RELEASED" || i.paymentStatus === "REFUNDED")
    .sort(byDesc((i) => i.paidAt));
  const pendingOffers = allInterests.filter((i) => i.paymentStatus === "OFFERED").sort(byDesc((i) => i.offeredAt));
  const awaitingPayment = allInterests.filter((i) => i.paymentStatus === "ACCEPTED").sort(byDesc((i) => i.acceptedAt));
  const deposits = DEPOSITS_ENABLED
    ? allInterests.filter((i) => i.depositStatus !== null).sort(byDesc((i) => i.depositRequestedAt))
    : [];

  const earnedCents = payments
    .filter((p) => p.paymentStatus === "RELEASED")
    .reduce((sum, p) => sum + p.payoutCents!, 0);
  // Not withdrawable — it's still the brand's money until the work is
  // posted and released, which is why this isn't labelled as a balance.
  const inEscrowCents = payments
    .filter((p) => p.paymentStatus === "HELD")
    .reduce((sum, p) => sum + p.payoutCents!, 0);
  // Same definition Discover uses: a released payment is a finished collab.
  const completedCount = payments.filter((p) => p.paymentStatus === "RELEASED").length;
  const inProgressCount = allInterests.filter(
    (i) => i.paymentStatus === "OFFERED" || i.paymentStatus === "ACCEPTED" || i.paymentStatus === "HELD",
  ).length;
  const ratings = allInterests.flatMap((i) => i.reviews.filter((r) => r.authorRole === "STARTUP").map((r) => r.rating));
  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;

  const isEmpty =
    payments.length === 0 && pendingOffers.length === 0 && awaitingPayment.length === 0 && deposits.length === 0;

  return (
    <div className="page-wide flex flex-col gap-8">
      <PageTitle>{t("nav.payments")}</PageTitle>
      <PaymentStats
        stats={[
          { label: t("screens.payments.earned"), value: formatCents(earnedCents), hint: t("screens.payments.paidOut") },
          { label: t("screens.payments.inEscrow"), value: formatCents(inEscrowCents), hint: t("screens.payments.releasedOnApproval") },
        ]}
        counts={[
          { label: t("screens.payments.completed"), value: String(completedCount) },
          { label: t("screens.payments.inProgress"), value: String(inProgressCount) },
          { label: t("screens.payments.rating"), value: averageRating === null ? "–" : `${averageRating.toFixed(1)} ★` },
        ]}
      />

      {creator.stripeOnboarded ? (
        <div className="flex items-center justify-between gap-3 rounded bg-fog px-4 py-3 no-print">
          <p className="flex min-w-0 items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <IoCheckmarkCircle className="h-5 w-5 shrink-0 text-ink" />
            {t("screens.payments.copy.payoutsConnected")}
          </p>
          <Link href="/dashboard/creator/settings#payouts" className="shrink-0 text-sm font-medium underline">
            {t("screens.payments.manage")}
          </Link>
        </div>
      ) : (
        <div className="rounded bg-fog p-4 no-print">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper">
              <IoWalletOutline className="h-5 w-5" />
            </span>
            {/* A Stripe account without the flag means setup was started
                and not finished (or Stripe is still checking it) — pick
                up from there rather than pitching it like a fresh start. */}
            {creator.stripeAccountId ? (
              <div className="min-w-0">
                <p className="font-medium">{t("screens.payments.copy.finishPayouts")}</p>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {t("screens.payments.copy.finishPayoutsBody")}
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="font-medium">{t("screens.payments.copy.setupPayouts")}</p>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {t("screens.payments.copy.setupPayoutsBody")}
                </p>
              </div>
            )}
          </div>
          <div className="mt-3">
            <ConnectStripeButton
              isOnboarded={false}
              label={creator.stripeAccountId ? t("screens.payments.copy.continueSetup") : undefined}
              embedClassName="mt-1"
            />
          </div>
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon={IoCardOutline}
          title={t("screens.payments.noneCreator")}
          description={t("screens.payments.copy.noneCreatorHistory")}
          action={{ label: t("screens.payments.browseFeed"), href: "/dashboard/creator" }}
        />
      )}

      {pendingOffers.length > 0 && (
        <PaymentSection title={t("screens.payments.offers")} count={pendingOffers.length} className="no-print">
          {pendingOffers.map((o) => {
            const brand = o.request.startup.companyName;
            const theirs = o.offerRole === "STARTUP";
            return (
              <PaymentRow
                key={o.id}
                avatarUrl={o.request.startup.avatarUrl}
                name={brand}
                title={o.request.title}
                headerAction={<ChatLink interestId={o.id} name={brand} />}
                badge={<PaymentStatusBadge status="OFFERED" />}
                amount={formatCents(o.amountCents!)}
                detail={
                  theirs
                    ? t("screens.payments.copy.youdGetEscrow", { payout: formatCents(o.payoutCents!) })
                    : t("screens.payments.copy.counterWaiting", { name: brand })
                }
              >
                {theirs ? (
                  <OfferResponseButtons interestId={o.id} otherPartyName={brand} />
                ) : (
                  <div className="mt-2">
                    <ActionButton
                      action={withdrawOfferAction.bind(null, o.id)}
                      successMessage={t("screens.payments.copy.counterWithdrawn")}
                      className={quietButton}
                    >
                      {t("screens.payments.copy.withdrawCounter")}
                    </ActionButton>
                  </div>
                )}
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}

      {awaitingPayment.length > 0 && (
        <PaymentSection title={t("screens.payments.waiting")} count={awaitingPayment.length} className="no-print">
          {awaitingPayment.map((i) => (
            <PaymentRow
              key={i.id}
              avatarUrl={i.request.startup.avatarUrl}
              name={i.request.startup.companyName}
              title={i.request.title}
              headerAction={<ChatLink interestId={i.id} name={i.request.startup.companyName} />}
              badge={<PaymentStatusBadge status="ACCEPTED" />}
              amount={formatCents(i.amountCents!)}
              detail={t("screens.payments.copy.acceptedBrandPays", {
                name: i.request.startup.companyName,
                payout: formatCents(i.payoutCents!),
              })}
            />
          ))}
        </PaymentSection>
      )}

      {payments.length > 0 && (
        <PaymentSection
          title={t("screens.payments.payments")}
          count={payments.length}
          action={
            <div className="flex shrink-0 items-center gap-2 no-print">
              <a href="/api/payments/export" aria-label={t("screens.payments.copy.exportCsv")} className={pillLink}>
                <IoDownloadOutline className="h-4 w-4" />
                CSV
              </a>
              <PrintButton />
            </div>
          }
        >
          {payments.map((p) => {
            const brand = p.request.startup.companyName;
            const myReview = p.reviews.find((r) => r.authorRole === "CREATOR");
            const stage = paymentStage({
              paymentStatus: p.paymentStatus!,
              proofSubmittedAt: p.proofSubmittedAt,
              disputedAt: p.disputedAt,
            });
            const payout = formatCents(p.payoutCents!);
            return (
              <PaymentRow
                key={p.id}
                avatarUrl={p.request.startup.avatarUrl}
                name={brand}
                title={p.request.title}
                headerAction={<ChatLink interestId={p.id} name={brand} />}
                badge={<PaymentStatusBadge status={stage} />}
                amount={formatCents(p.amountCents!)}
                detail={
                  <>
                    {stage === "HELD" &&
                      (creator.stripeOnboarded
                        ? t("screens.payments.copy.postThenSubmit", { name: brand, days: RELEASE_REVIEW_DAYS, payout })
                        : t("screens.payments.copy.payoutWaitingSetup", { payout }))}
                    {stage === "SUBMITTED" && (
                      <>
                        {t("screens.payments.copy.waitingApproveBy", { name: brand })}
                        <LocalDate ms={p.proofSubmittedAt!.getTime() + RELEASE_REVIEW_MS} />
                        {t("screens.payments.copy.autoReleaseRest", { payout })}
                      </>
                    )}
                    {stage === "DISPUTED" &&
                      t("screens.payments.copy.brandReported", { name: brand, reason: p.disputeReason ?? "" })}
                    {stage === "RELEASED" && t("screens.payments.copy.youReceived", { payout })}
                    {/* A release moves the money to the creator's Stripe
                        balance, not their bank yet — for the first week,
                        say when to expect it rather than leave them
                        checking their account the same afternoon. */}
                    {stage === "RELEASED" &&
                      p.releasedAt &&
                      isWithinLastWeek(p.releasedAt.getTime()) &&
                      t("screens.payments.copy.stripeBank")}
                    {stage === "REFUNDED" && t("screens.payments.copy.brandCancelled", { name: brand })}
                    {stage !== "HELD" && stage !== "REFUNDED" && p.proofUrl && (
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
                {stage === "HELD" && creator.stripeOnboarded && <SubmitPostForm interestId={p.id} brandName={brand} />}
                {stage === "SUBMITTED" && (
                  <div className="mt-2">
                    <SubmitPostButton
                      interestId={p.id}
                      brandName={brand}
                      defaultUrl={p.proofUrl ?? undefined}
                      label={t("screens.payments.copy.wrongLink")}
                      className={quietButton}
                    />
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
          description={t("screens.payments.copy.depositsCreatorHint")}
        >
          {deposits.map((d) => {
            const brand = d.request.startup.companyName;
            return (
              <PaymentRow
                key={d.id}
                avatarUrl={d.request.startup.avatarUrl}
                name={brand}
                title={d.request.title}
                headerAction={<ChatLink interestId={d.id} name={brand} />}
                badge={<DepositStatusBadge status={d.depositStatus!} />}
                amount={formatCents(d.depositCents!)}
                detail={
                  <>
                    {d.depositStatus === "REQUESTED" && t("screens.payments.copy.depositAsk", { name: brand })}
                    {d.depositStatus === "HELD" && t("screens.payments.copy.depositHeldUntil", { name: brand })}
                    {d.depositStatus === "RELEASED" && t("screens.payments.copy.depositReturnedFull")}
                    {d.depositStatus === "FORFEITED" && t("screens.payments.copy.depositForfeitedBrand", { name: brand })}
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
                {d.depositStatus === "REQUESTED" && (
                  <ActionButton
                    action={payDepositAction.bind(null, d.id)}
                    successMessage={t("screens.payments.copy.depositPaidToast")}
                    pendingChildren={t("screens.payments.copy.paying")}
                    className={`${primaryButton} no-print`}
                  >
                    {t("screens.payments.copy.payDeposit", { amount: formatCents(d.depositCents!) })}
                  </ActionButton>
                )}
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}
    </div>
  );
}
