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

const primaryButton =
  "mt-3 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto";
const quietButton = "text-xs text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400";
const pillLink =
  "inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700";

export default async function CreatorPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

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
    <div className="flex flex-col gap-8">
      <PaymentStats
        stats={[
          { label: "Earned", value: formatCents(earnedCents), hint: "Paid out to you" },
          { label: "In escrow", value: formatCents(inEscrowCents), hint: "Released on approval" },
        ]}
        counts={[
          { label: "Completed", value: String(completedCount) },
          { label: "In progress", value: String(inProgressCount) },
          { label: "Rating", value: averageRating === null ? "–" : `${averageRating.toFixed(1)} ★` },
        ]}
      />

      {creator.stripeOnboarded ? (
        <div className="flex items-center justify-between gap-3 rounded-[20px] bg-fog px-4 py-3 no-print">
          <p className="flex min-w-0 items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <IoCheckmarkCircle className="h-5 w-5 shrink-0 text-ink" />
            Payouts connected — released payments go to your bank account.
          </p>
          <Link href="/dashboard/creator/settings#payouts" className="shrink-0 text-sm font-medium underline">
            Manage
          </Link>
        </div>
      ) : (
        <div className="rounded-[20px] border border-ink/10 p-4 no-print">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fog">
              <IoWalletOutline className="h-5 w-5" />
            </span>
            {/* A Stripe account without the flag means setup was started
                and not finished (or Stripe is still checking it) — pick
                up from there rather than pitching it like a fresh start. */}
            {creator.stripeAccountId ? (
              <div className="min-w-0">
                <p className="font-medium">Finish setting up payouts</p>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                  Stripe hasn&apos;t confirmed your payout account yet. Pick up where you left off to see what&apos;s
                  still missing.
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="font-medium">Set up payouts</p>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                  Connect Stripe so a brand&apos;s payment can reach your bank account — you&apos;ll need it before
                  you can submit a post for payment.
                </p>
              </div>
            )}
          </div>
          <div className="mt-3">
            <ConnectStripeButton
              isOnboarded={false}
              label={creator.stripeAccountId ? "Continue setup" : undefined}
              embedClassName="mt-1"
            />
          </div>
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon={IoCardOutline}
          title="No payments yet"
          description="When a brand sends you an offer, it shows up here and in your chat with them. Paid collabs stay here as your history."
          action={{ label: "Browse your feed", href: "/dashboard/creator" }}
        />
      )}

      {pendingOffers.length > 0 && (
        <PaymentSection title="Offers" count={pendingOffers.length} className="no-print">
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
                    ? `You'd get ${formatCents(o.payoutCents!)} after the platform fee, held in escrow until you post.`
                    : `Your counter-offer — waiting for ${brand} to respond.`
                }
              >
                {theirs ? (
                  <OfferResponseButtons interestId={o.id} otherPartyName={brand} />
                ) : (
                  <div className="mt-2">
                    <ActionButton
                      action={withdrawOfferAction.bind(null, o.id)}
                      successMessage="Counter-offer withdrawn."
                      className={quietButton}
                    >
                      Withdraw counter-offer
                    </ActionButton>
                  </div>
                )}
              </PaymentRow>
            );
          })}
        </PaymentSection>
      )}

      {awaitingPayment.length > 0 && (
        <PaymentSection title="Waiting for payment" count={awaitingPayment.length} className="no-print">
          {awaitingPayment.map((i) => (
            <PaymentRow
              key={i.id}
              avatarUrl={i.request.startup.avatarUrl}
              name={i.request.startup.companyName}
              title={i.request.title}
              headerAction={<ChatLink interestId={i.id} name={i.request.startup.companyName} />}
              badge={<PaymentStatusBadge status="ACCEPTED" />}
              amount={formatCents(i.amountCents!)}
              detail={`Accepted — ${i.request.startup.companyName} pays next, and it's held in escrow until you post. You'll get ${formatCents(i.payoutCents!)} after the platform fee.`}
            />
          ))}
        </PaymentSection>
      )}

      {payments.length > 0 && (
        <PaymentSection
          title="Payments"
          count={payments.length}
          action={
            <div className="flex shrink-0 items-center gap-2 no-print">
              <a href="/api/payments/export" aria-label="Export as CSV" className={pillLink}>
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
                        ? `Post the content, then submit the link below. ${brand} has ${RELEASE_REVIEW_DAYS} days to approve it — if they don't respond, your ${payout} (after the platform fee) is released automatically.`
                        : `Your ${payout} (after the platform fee) is waiting — set up payouts above, then submit the link to your post.`)}
                    {stage === "SUBMITTED" && (
                      <>
                        Waiting for {brand} to approve your post. If they don&apos;t respond by{" "}
                        <LocalDate ms={p.proofSubmittedAt!.getTime() + RELEASE_REVIEW_MS} />, your {payout} is released
                        automatically.
                      </>
                    )}
                    {stage === "DISPUTED" &&
                      `${brand} reported a problem with the post: “${p.disputeReason}” The payment is on hold while we look into it — we'll get back to you both.`}
                    {stage === "RELEASED" && `You received ${payout} after the platform fee.`}
                    {/* A release moves the money to the creator's Stripe
                        balance, not their bank yet — for the first week,
                        say when to expect it rather than leave them
                        checking their account the same afternoon. */}
                    {stage === "RELEASED" &&
                      p.releasedAt &&
                      isWithinLastWeek(p.releasedAt.getTime()) &&
                      " Stripe sends it on to your bank, usually within a few business days — the first payout can take a little longer."}
                    {stage === "REFUNDED" && `${brand} cancelled this collab and got a full refund.`}
                    {stage !== "HELD" && stage !== "REFUNDED" && p.proofUrl && (
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
                {stage === "HELD" && creator.stripeOnboarded && <SubmitPostForm interestId={p.id} brandName={brand} />}
                {stage === "SUBMITTED" && (
                  <div className="mt-2">
                    <SubmitPostButton
                      interestId={p.id}
                      brandName={brand}
                      defaultUrl={p.proofUrl ?? undefined}
                      label="Wrong link? Update it"
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
          title="Deposits"
          count={deposits.length}
          description="Refundable, no fee — you get the full amount back once the brand confirms your post."
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
                    {d.depositStatus === "REQUESTED" && `${brand} asks for a refundable deposit before shipping product.`}
                    {d.depositStatus === "HELD" && `Held until ${brand} confirms your post, then returned to you in full.`}
                    {d.depositStatus === "RELEASED" && "Returned to you in full."}
                    {d.depositStatus === "FORFEITED" && `${brand} kept it — they said the content wasn't delivered.`}
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
                {d.depositStatus === "REQUESTED" && (
                  <ActionButton
                    action={payDepositAction.bind(null, d.id)}
                    successMessage="Deposit paid."
                    pendingChildren="Paying…"
                    className={`${primaryButton} no-print`}
                  >
                    Pay {formatCents(d.depositCents!)} deposit
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
