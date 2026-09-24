import { redirect } from "next/navigation";
import { FiDollarSign, FiShield } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/avatar";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { ReviewForm } from "@/components/review-form";
import { PrintButton } from "@/components/print-button";
import { ReleasePaymentForm } from "@/components/release-payment-form";
import { DepositStatusBadge } from "@/components/deposit-status-badge";
import { ActionButton } from "@/components/action-button";
import { OfferResponseActions } from "@/components/offer-response-actions";
import { EmptyState } from "@/components/empty-state";
import { payDepositAction } from "@/lib/actions/deposits";
import { withdrawOfferAction } from "@/lib/actions/payments";
import { formatCents } from "@/lib/format";

export default async function CreatorPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  // One round-trip instead of two — filtered through the creator relation
  // rather than creator.id, so this doesn't have to wait on the fetch below
  // to know what to ask for. Also one query instead of four sequential ones
  // for the same reason the startup payments page's version is.
  const [, allInterests] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.interest.findMany({
      where: { creator: { userId: session.user.id } },
      include: { request: { include: { startup: true } }, reviews: { where: { authorRole: "CREATOR" } } },
    }),
  ]);
  const byDesc = <T,>(key: (i: T) => Date | null) => (a: T, b: T) => (key(b)?.getTime() ?? 0) - (key(a)?.getTime() ?? 0);

  const payments = allInterests
    .filter((i) => i.paymentStatus === "HELD" || i.paymentStatus === "RELEASED" || i.paymentStatus === "REFUNDED")
    .sort(byDesc((i) => i.paidAt));
  const pendingOffers = allInterests.filter((i) => i.paymentStatus === "OFFERED").sort(byDesc((i) => i.offeredAt));
  const awaitingPayment = allInterests.filter((i) => i.paymentStatus === "ACCEPTED").sort(byDesc((i) => i.acceptedAt));
  const deposits = allInterests.filter((i) => i.depositStatus !== null).sort(byDesc((i) => i.depositRequestedAt));

  const totalEarnedCents = payments
    .filter((p) => p.paymentStatus === "RELEASED")
    .reduce((sum, p) => sum + p.payoutCents!, 0);
  const availableToWithdrawCents = payments
    .filter((p) => p.paymentStatus === "HELD")
    .reduce((sum, p) => sum + p.payoutCents!, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Payments</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Payments run through Stripe. Amounts below are already net of our platform fee. Connect
          Stripe in Settings before a payment can be released to you.
        </p>
      </div>

      {pendingOffers.length > 0 && (
        <div className="no-print">
          <h2 className="font-semibold mb-3">Offers ({pendingOffers.length})</h2>
          <div className="flex flex-col gap-3">
            {pendingOffers.map((o) => (
              <div key={o.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
                <Avatar src={o.request.startup.avatarUrl} name={o.request.startup.companyName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {o.request.startup.companyName} · {o.request.title}
                    </p>
                    <PaymentStatusBadge status="OFFERED" />
                  </div>
                  {o.offerRole === "STARTUP" ? (
                    <>
                      <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                        Offered {formatCents(o.amountCents!)} — you&apos;d receive{" "}
                        {formatCents(o.payoutCents!)} after our platform fee, held in escrow
                        until you post the content.
                      </p>
                      <OfferResponseActions interestId={o.id} />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                        You countered with {formatCents(o.amountCents!)} — awaiting{" "}
                        {o.request.startup.companyName}&apos;s response.
                      </p>
                      <ActionButton
                        action={withdrawOfferAction.bind(null, o.id)}
                        successMessage="Counter-offer withdrawn."
                        className="text-xs text-neutral-400 hover:text-ink transition mt-2 disabled:opacity-50"
                      >
                        Withdraw counter
                      </ActionButton>
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
                <Avatar src={i.request.startup.avatarUrl} name={i.request.startup.companyName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {i.request.startup.companyName} · {i.request.title}
                    </p>
                    <PaymentStatusBadge status="ACCEPTED" />
                  </div>
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    Accepted at {formatCents(i.amountCents!)} — waiting on {i.request.startup.companyName} to
                    complete payment via Stripe.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 no-print">
          <div className="rounded-2xl border border-ink/10 p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total earned</p>
            <p className="font-display text-title-1 font-bold mt-1">{formatCents(totalEarnedCents)}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Available to withdraw</p>
            <p className="font-display text-title-1 font-bold mt-1">{formatCents(availableToWithdrawCents)}</p>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">Held until you post the content</p>
          </div>
        </div>
      )}
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
      {payments.length === 0 ? (
        <EmptyState icon={FiDollarSign} title="No payments yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
              <Avatar src={p.request.startup.avatarUrl} name={p.request.startup.companyName} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {p.request.startup.companyName} · {p.request.title}
                  </p>
                  <PaymentStatusBadge status={p.paymentStatus!} />
                </div>
                {p.paymentStatus === "HELD" && (
                  <>
                    <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                      {formatCents(p.payoutCents!)} (already net of platform fee) is held in
                      escrow and not yet withdrawable. Post the content to release it to
                      yourself.
                    </p>
                    <ReleasePaymentForm interestId={p.id} />
                  </>
                )}
                {p.paymentStatus === "REFUNDED" && (
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    Cancelled by the brand on {p.refundedAt!.toLocaleDateString("en-US")} — this
                    payment was refunded and is no longer available.
                  </p>
                )}
                {p.paymentStatus === "RELEASED" && (
                  <>
                    <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                      You received {formatCents(p.payoutCents!)} (net of platform fee) on{" "}
                      {p.releasedAt!.toLocaleDateString("en-US")}.
                      {p.proofUrl && (
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
                    <ReviewForm
                      key={`${p.reviews[0]?.rating}-${p.reviews[0]?.comment}`}
                      interestId={p.id}
                      initial={p.reviews[0] ? { rating: p.reviews[0].rating, comment: p.reviews[0].comment } : undefined}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h1 className="font-display text-title-1 font-bold">Deposits</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Refundable security deposits for shipped product — no platform fee, you get the full
          amount back once the brand confirms your post.
        </p>
      </div>
      {deposits.length === 0 ? (
        <EmptyState icon={FiShield} title="No deposits yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {deposits.map((d) => (
            <div key={d.id} className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start">
              <Avatar src={d.request.startup.avatarUrl} name={d.request.startup.companyName} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {d.request.startup.companyName} · {d.request.title}
                  </p>
                  <DepositStatusBadge status={d.depositStatus!} />
                </div>
                {d.depositStatus === "REQUESTED" && (
                  <>
                    <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                      {d.request.startup.companyName} is requesting a {formatCents(d.depositCents!)} refundable
                      deposit before shipping product for this collab.
                    </p>
                    <ActionButton
                      action={payDepositAction.bind(null, d.id)}
                      successMessage="Deposit paid."
                      className="mt-2 rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
                    >
                      Pay {formatCents(d.depositCents!)} deposit
                    </ActionButton>
                  </>
                )}
                {d.depositStatus === "HELD" && (
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    Your {formatCents(d.depositCents!)} deposit is held — you&apos;ll get it back once{" "}
                    {d.request.startup.companyName} confirms your post.
                  </p>
                )}
                {d.depositStatus === "RELEASED" && (
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    Your {formatCents(d.depositCents!)} deposit was returned on{" "}
                    {d.depositReleasedAt!.toLocaleDateString("en-US")}.
                  </p>
                )}
                {d.depositStatus === "FORFEITED" && (
                  <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">
                    {d.request.startup.companyName} kept your {formatCents(d.depositCents!)} deposit on{" "}
                    {d.depositForfeitedAt!.toLocaleDateString("en-US")} — they determined the content wasn&apos;t
                    delivered.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
