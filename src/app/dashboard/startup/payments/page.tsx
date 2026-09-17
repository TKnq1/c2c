import Link from "next/link";
import { redirect } from "next/navigation";
import { FiDollarSign, FiShield } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/avatar";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { SendOfferForm } from "@/components/send-offer-form";
import { OfferResponseActions } from "@/components/offer-response-actions";
import { ReviewForm } from "@/components/review-form";
import { PrintButton } from "@/components/print-button";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/empty-state";
import { refundPaymentAction, withdrawOfferAction } from "@/lib/actions/payments";
import { CompletePaymentButton } from "@/components/complete-payment-button";
import { DepositStatusBadge } from "@/components/deposit-status-badge";
import { RequestDepositForm } from "@/components/request-deposit-form";
import { releaseDepositAction, forfeitDepositAction } from "@/lib/actions/deposits";
import { formatCents } from "@/lib/format";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";

export default async function StartupPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  // One query instead of six sequential ones — the six lists below are all
  // just different filtered/sorted views over the same startup's interests,
  // so it's cheaper to fetch them all once and split/sort in JS than to
  // round-trip to Neon six times for the same underlying rows.
  const allInterests = await prisma.interest.findMany({
    where: { request: { startupId: startup.id } },
    include: { request: true, creator: true, reviews: { where: { authorRole: "STARTUP" } } },
  });
  const byDesc = <T,>(key: (i: T) => Date | null) => (a: T, b: T) => (key(b)?.getTime() ?? 0) - (key(a)?.getTime() ?? 0);

  const payments = allInterests
    .filter((i) => i.paymentStatus === "HELD" || i.paymentStatus === "RELEASED" || i.paymentStatus === "REFUNDED")
    .sort(byDesc((i) => i.paidAt));
  const awaitingOffer = allInterests.filter((i) => i.paymentStatus === null).sort(byDesc((i) => i.createdAt));
  const pendingOffers = allInterests.filter((i) => i.paymentStatus === "OFFERED").sort(byDesc((i) => i.offeredAt));
  const awaitingPayment = allInterests.filter((i) => i.paymentStatus === "ACCEPTED").sort(byDesc((i) => i.acceptedAt));
  const awaitingDeposit = allInterests.filter((i) => i.depositStatus === null).sort(byDesc((i) => i.createdAt));
  const deposits = allInterests.filter((i) => i.depositStatus !== null).sort(byDesc((i) => i.depositRequestedAt));

  // Refunded money came back, so it no longer counts as "spent".
  const totalSpentCents = payments
    .filter((p) => p.paymentStatus !== "REFUNDED")
    .reduce((sum, p) => sum + p.amountCents!, 0);
  const pendingCents = payments
    .filter((p) => p.paymentStatus === "HELD")
    .reduce((sum, p) => sum + p.amountCents!, 0);

  // Overview stats, spanning both payments and deposits.
  const currentlyHeldCents =
    pendingCents + deposits.filter((d) => d.depositStatus === "HELD").reduce((sum, d) => sum + d.depositCents!, 0);
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

  return (
    <div className="flex flex-col gap-6">
      {(payments.length > 0 || deposits.length > 0) && (
        <div className="no-print">
          <h1 className="font-display text-3xl font-normal mb-3">Overview</h1>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total spent</p>
              <p className="font-display text-3xl font-normal mt-1">{formatCents(totalSpentCents)}</p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Currently held</p>
              <p className="font-display text-3xl font-normal mt-1">{formatCents(currentlyHeldCents)}</p>
              <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">Payments + deposits in escrow</p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Creators worked with</p>
              <p className="font-display text-3xl font-normal mt-1">{creatorsWorkedWith}</p>
            </div>
          </div>
          {bestRequest && (
            <p className="text-sm text-neutral-600 mt-3 dark:text-neutral-400">
              Best-performing request: <span className="font-medium text-neutral-900 dark:text-neutral-100">{bestRequest.title}</span> —{" "}
              {formatCents(bestRequest.totalCents)} total
            </p>
          )}
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-normal">Payments</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Payments run through Stripe. Send an interested creator an offer; once they accept,
          complete payment via Stripe Checkout — funds are held until the creator posts the
          content, and we hold {feeRatePercent}% of every payment as our platform fee.
        </p>
        <div className="rounded border border-ink/10 px-4 py-3 mt-3 flex items-center justify-between gap-3 no-print">
          {startup.isPro ? (
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              You&apos;re on the <span className="font-medium text-ink">Pro plan</span> — {PRO_PLATFORM_FEE_RATE * 100}%
              fee instead of {PLATFORM_FEE_RATE * 100}%.
            </p>
          ) : (
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Paying {PLATFORM_FEE_RATE * 100}% per offer. Pro drops that to {PRO_PLATFORM_FEE_RATE * 100}% for{" "}
              {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month.
            </p>
          )}
          <Link
            href="/dashboard/startup/settings#plan"
            className="text-sm font-medium underline shrink-0 whitespace-nowrap"
          >
            {startup.isPro ? "Manage plan" : "Go Pro"}
          </Link>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 no-print">
          <div className="rounded-2xl border border-ink/10 p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total spent</p>
            <p className="font-display text-3xl font-normal mt-1">{formatCents(totalSpentCents)}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending release</p>
            <p className="font-display text-3xl font-normal mt-1">{formatCents(pendingCents)}</p>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">Held until the creator posts the content</p>
          </div>
        </div>
      )}

      {awaitingOffer.length > 0 && (
        <div className="no-print">
          <h2 className="font-semibold mb-3">Send an offer ({awaitingOffer.length})</h2>
          <div className="flex flex-col gap-3">
            {awaitingOffer.map((i) => (
              <div key={i.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
                <Avatar src={i.creator.avatarUrl} name={i.creator.displayName} size={40} />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/startup/requests/${i.requestId}`}
                    className="font-medium hover:underline"
                  >
                    {i.creator.displayName} · {i.request.title}
                  </Link>
                  <SendOfferForm interestId={i.id} feeRatePercent={feeRatePercent} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingOffers.length > 0 && (
        <div className="no-print">
          <h2 className="font-semibold mb-3">Offers ({pendingOffers.length})</h2>
          <div className="flex flex-col gap-3">
            {pendingOffers.map((i) => (
              <div key={i.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
                <Avatar src={i.creator.avatarUrl} name={i.creator.displayName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/startup/requests/${i.requestId}`}
                      className="font-medium hover:underline"
                    >
                      {i.creator.displayName} · {i.request.title}
                    </Link>
                    <PaymentStatusBadge status="OFFERED" />
                  </div>
                  {i.offerRole === "STARTUP" ? (
                    <>
                      <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                        Offered {formatCents(i.amountCents!)}, awaiting their response.
                      </p>
                      <ActionButton
                        action={withdrawOfferAction.bind(null, i.id)}
                        successMessage="Offer withdrawn."
                        className="text-xs text-neutral-400 hover:text-ink transition mt-2 disabled:opacity-50"
                      >
                        Withdraw offer
                      </ActionButton>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                        {i.creator.displayName} countered with {formatCents(i.amountCents!)} —
                        they&apos;d receive {formatCents(i.payoutCents!)} after our platform fee.
                      </p>
                      <OfferResponseActions interestId={i.id} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {awaitingPayment.length > 0 && (
        <div className="no-print">
          <h2 className="font-semibold mb-3">Awaiting payment ({awaitingPayment.length})</h2>
          <div className="flex flex-col gap-3">
            {awaitingPayment.map((i) => (
              <div key={i.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
                <Avatar src={i.creator.avatarUrl} name={i.creator.displayName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/startup/requests/${i.requestId}`}
                      className="font-medium hover:underline"
                    >
                      {i.creator.displayName} · {i.request.title}
                    </Link>
                    <PaymentStatusBadge status="ACCEPTED" />
                  </div>
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    Accepted at {formatCents(i.amountCents!)} — complete payment to hold it in escrow.
                  </p>
                  <CompletePaymentButton interestId={i.id} label={`Pay ${formatCents(i.amountCents!)}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold">Payment history</h2>
          {payments.length > 0 && (
            <div className="flex items-center gap-2 no-print">
              <a
                href="/api/payments/export"
                className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800/50"
              >
                Export CSV
              </a>
              <PrintButton />
            </div>
          )}
        </div>
        {payments.length === 0 ? (
          <EmptyState
            icon={FiDollarSign}
            title="No payments yet."
            description="Send an interested creator an offer above to get started."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((p) => (
              <div key={p.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
                <Avatar src={p.creator.avatarUrl} name={p.creator.displayName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/startup/requests/${p.requestId}`}
                      className="font-medium hover:underline"
                    >
                      {p.creator.displayName} · {p.request.title}
                    </Link>
                    <PaymentStatusBadge status={p.paymentStatus!} />
                  </div>
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    You paid {formatCents(p.amountCents!)} —{" "}
                    {p.paymentStatus === "HELD" &&
                      `held until the creator posts the content — not withdrawable by them yet. They'll then receive ${formatCents(p.payoutCents!)} after our ${Math.round((p.platformFeeCents! / p.amountCents!) * 100)}% fee (${formatCents(p.platformFeeCents!)}).`}
                    {p.paymentStatus === "RELEASED" &&
                      `creator received ${formatCents(p.payoutCents!)} after our ${Math.round((p.platformFeeCents! / p.amountCents!) * 100)}% fee (${formatCents(p.platformFeeCents!)}).`}
                    {p.paymentStatus === "REFUNDED" && "cancelled — the full amount was refunded to you."}
                    {p.paymentStatus === "RELEASED" && p.proofUrl && (
                      <>
                        {" "}
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-neutral-500 dark:text-neutral-400"
                        >
                          View post
                        </a>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
                    Paid {p.paidAt!.toLocaleDateString("en-US")}
                    {p.releasedAt && ` · Released ${p.releasedAt.toLocaleDateString("en-US")}`}
                    {p.refundedAt && ` · Refunded ${p.refundedAt.toLocaleDateString("en-US")}`}
                  </p>
                  {p.paymentStatus === "HELD" && (
                    <ActionButton
                      action={refundPaymentAction.bind(null, p.id)}
                      successMessage="Payment refunded."
                      confirmMessage={`Refund ${formatCents(p.amountCents!)} and cancel this payment to ${p.creator.displayName}? This can't be undone.`}
                      className="text-xs text-neutral-400 hover:text-ink transition mt-2 disabled:opacity-50 no-print dark:text-neutral-500"
                    >
                      Creator never delivered? Cancel &amp; refund
                    </ActionButton>
                  )}
                  {p.paymentStatus === "RELEASED" && (
                    <ReviewForm
                      key={`${p.reviews[0]?.rating}-${p.reviews[0]?.comment}`}
                      interestId={p.id}
                      initial={p.reviews[0] ? { rating: p.reviews[0].rating, comment: p.reviews[0].comment } : undefined}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-display text-3xl font-normal">Deposits</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Refundable security deposits for shipped product — no platform fee, the full amount is
          either returned or kept by you.
        </p>
      </div>

      {awaitingDeposit.length > 0 && (
        <div className="no-print">
          <h2 className="font-semibold mb-3">Request a deposit ({awaitingDeposit.length})</h2>
          <div className="flex flex-col gap-3">
            {awaitingDeposit.map((i) => (
              <div key={i.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
                <Avatar src={i.creator.avatarUrl} name={i.creator.displayName} size={40} />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/startup/requests/${i.requestId}`}
                    className="font-medium hover:underline"
                  >
                    {i.creator.displayName} · {i.request.title}
                  </Link>
                  <RequestDepositForm interestId={i.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Deposit history</h2>
        {deposits.length === 0 ? (
          <EmptyState
            icon={FiShield}
            title="No deposits yet."
            description="Request one above when you're shipping product to a creator."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {deposits.map((d) => (
              <div key={d.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
                <Avatar src={d.creator.avatarUrl} name={d.creator.displayName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/startup/requests/${d.requestId}`}
                      className="font-medium hover:underline"
                    >
                      {d.creator.displayName} · {d.request.title}
                    </Link>
                    <DepositStatusBadge status={d.depositStatus!} />
                  </div>
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    {d.depositStatus === "REQUESTED" && `Awaiting the creator's ${formatCents(d.depositCents!)} deposit.`}
                    {d.depositStatus === "HELD" &&
                      `${formatCents(d.depositCents!)} held — return it once you confirm the content was posted.`}
                    {d.depositStatus === "RELEASED" && `${formatCents(d.depositCents!)} returned to the creator.`}
                    {d.depositStatus === "FORFEITED" && `${formatCents(d.depositCents!)} kept — the creator didn't deliver.`}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
                    Requested {d.depositRequestedAt!.toLocaleDateString("en-US")}
                    {d.depositPaidAt && ` · Paid ${d.depositPaidAt.toLocaleDateString("en-US")}`}
                    {d.depositReleasedAt && ` · Returned ${d.depositReleasedAt.toLocaleDateString("en-US")}`}
                    {d.depositForfeitedAt && ` · Kept ${d.depositForfeitedAt.toLocaleDateString("en-US")}`}
                  </p>
                  {d.depositStatus === "HELD" && (
                    <div className="flex items-center gap-3 mt-2 no-print flex-wrap">
                      <ActionButton
                        action={releaseDepositAction.bind(null, d.id)}
                        successMessage="Deposit returned."
                        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 shrink-0 whitespace-nowrap"
                      >
                        Return deposit
                      </ActionButton>
                      <ActionButton
                        action={forfeitDepositAction.bind(null, d.id)}
                        successMessage="Deposit kept."
                        confirmMessage={`Keep ${formatCents(d.depositCents!)} and mark this deposit as forfeited? ${d.creator.displayName} won't get it back. This can't be undone.`}
                        className="text-xs text-neutral-400 hover:text-ink transition disabled:opacity-50"
                      >
                        Creator never delivered? Keep deposit
                      </ActionButton>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
