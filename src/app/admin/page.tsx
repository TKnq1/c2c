import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { resolveReportAction, dismissReportAction } from "@/lib/actions/moderation";
import { refundDisputedPaymentAction, releaseDisputedPaymentAction } from "@/lib/actions/disputes";
import { removeWaitlistEntryAction } from "@/lib/actions/waitlist";
import { RelativeTime } from "@/components/relative-time";
import { PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";

// The newest ones on the page; the CSV has everyone.
const WAITLIST_SHOWN = 50;

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    totalStartups,
    totalCreators,
    totalRequests,
    openRequests,
    totalInterests,
    volumeAgg,
    volumeCount,
    releasedFeeAgg,
    heldFeeAgg,
    recentPayments,
    proSubscribers,
    recentUsers,
    recentRequests,
    openReports,
    waitlistTotal,
    waitlistCreators,
    waitlistBrands,
    waitlist,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STARTUP" } }),
    prisma.user.count({ where: { role: "CREATOR" } }),
    prisma.request.count(),
    prisma.request.count({ where: { status: "OPEN" } }),
    prisma.interest.count(),
    // "Spent" excludes OFFERED/ACCEPTED (no money has moved yet for either)
    // and REFUNDED (that money went back) — only HELD/RELEASED are real,
    // currently-outstanding volume. Summed in the database rather than
    // loading every payment row just to add them up in JS.
    prisma.interest.aggregate({
      where: { paymentStatus: { in: ["HELD", "RELEASED"] } },
      _sum: { amountCents: true },
    }),
    prisma.interest.count({ where: { paymentStatus: { in: ["HELD", "RELEASED"] } } }),
    // Platform revenue is only what's actually been kept — fees on HELD
    // payments are still contingent on release, not revenue yet.
    prisma.interest.aggregate({
      where: { paymentStatus: "RELEASED" },
      _sum: { platformFeeCents: true },
    }),
    prisma.interest.aggregate({
      where: { paymentStatus: "HELD" },
      _sum: { platformFeeCents: true },
    }),
    prisma.interest.findMany({
      where: { paymentStatus: { in: ["HELD", "RELEASED", "REFUNDED"] } },
      include: { creator: true, request: { include: { startup: true } } },
      orderBy: { paidAt: "desc" },
      take: 8,
    }),
    prisma.startupProfile.count({ where: { isPro: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.request.findMany({
      include: { startup: true, _count: { select: { interests: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: { reporter: true, reported: true },
      orderBy: { createdAt: "desc" },
    }),
    // Who left their email on the landing page (see WaitlistForm).
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { role: "CREATOR" } }),
    prisma.waitlistEntry.count({ where: { role: "STARTUP" } }),
    prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" }, take: WAITLIST_SHOWN }),
  ]);
  // Oldest first — the money has been frozen longest there.
  const disputes = await prisma.interest.findMany({
    where: { paymentStatus: "HELD", disputedAt: { not: null } },
    include: { creator: { include: { user: true } }, request: { include: { startup: { include: { user: true } } } } },
    orderBy: { disputedAt: "asc" },
  });

  const mrrCents = proSubscribers * PRO_SUBSCRIPTION_PRICE_CENTS;
  const totalVolumeCents = volumeAgg._sum.amountCents ?? 0;
  const platformRevenueCents = releasedFeeAgg._sum.platformFeeCents ?? 0;
  const pendingFeeCents = heldFeeAgg._sum.platformFeeCents ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-title-1 font-bold">Admin overview</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Platform-wide snapshot. Mostly read-only, aside from settling payment disputes and resolving reports below.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Users</p>
          <p className="font-display text-title-1 font-bold mt-1">{totalUsers}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {totalStartups} brands · {totalCreators} creators
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Requests</p>
          <p className="font-display text-title-1 font-bold mt-1">{totalRequests}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {openRequests} open · {totalInterests} interests expressed
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Commission revenue</p>
          <p className="font-display text-title-1 font-bold mt-1">{formatCents(platformRevenueCents)}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {formatCents(pendingFeeCents)} pending in escrow
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Pro subscribers</p>
          <p className="font-display text-title-1 font-bold mt-1">{proSubscribers}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {formatCents(mrrCents)}/mo recurring
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total payment volume</p>
          <p className="font-display text-title-1 font-bold mt-1">{formatCents(totalVolumeCents)}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            Across {volumeCount} non-refunded payments, real escrow via Stripe.
          </p>
        </div>
        <a href="#waitlist" className="rounded-2xl border border-ink/10 p-4 transition hover:border-ink/30">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Waitlist</p>
          <p className="font-display text-title-1 font-bold mt-1">{waitlistTotal}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {waitlistCreators} creators · {waitlistBrands} brands, from comtor.app
          </p>
        </a>
      </div>

      <div id="waitlist" className="scroll-mt-6">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Waitlist ({waitlistTotal})</h2>
          {waitlistTotal > 0 && (
            <a href="/api/admin/waitlist" className="text-sm font-medium underline">
              Download CSV
            </a>
          )}
        </div>
        <p className="text-sm text-neutral-500 mb-3 dark:text-neutral-400">
          Emails left on the landing page to hear when the iOS and Android apps are out. Stored here only, nobody has
          been emailed yet. Remove someone when they ask to be taken off the list.
        </p>
        {waitlist.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Nobody yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {waitlist.map((w) => (
              <div key={w.id} className="rounded-xl border border-ink/10 px-4 py-2 flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm">{w.email}</span>
                <span className="flex shrink-0 items-center gap-3">
                  {w.role && (
                    <span className="text-xs rounded bg-fog text-neutral-700 px-2 py-1 dark:text-neutral-300">
                      {w.role === "STARTUP" ? "Brand" : "Creator"}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    <RelativeTime ms={w.createdAt.getTime()} />
                  </span>
                  <ConfirmActionButton
                    action={removeWaitlistEntryAction.bind(null, w.id)}
                    successMessage="Removed from the waitlist."
                    title="Remove from the waitlist?"
                    description={`${w.email} is deleted and won't get the launch email. This can't be undone.`}
                    confirmLabel="Remove"
                    pendingLabel="Removing…"
                    className="text-xs text-neutral-400 hover:text-ink transition disabled:opacity-50 dark:text-neutral-500"
                  >
                    Remove
                  </ConfirmActionButton>
                </span>
              </div>
            ))}
            {waitlistTotal > waitlist.length && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                The newest {waitlist.length} of {waitlistTotal}. The CSV has all of them.
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-1">Payment disputes ({disputes.length})</h2>
        <p className="text-sm text-neutral-500 mb-3 dark:text-neutral-400">
          A brand reported a problem with a creator&apos;s post, so the payment is frozen. Check the post, contact both
          sides by email, then release it to the creator or refund the brand.
        </p>
        {disputes.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Nothing to settle.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {disputes.map((d) => (
              <div key={d.id} className="rounded-xl border border-ink/10 px-4 py-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">
                    <span className="font-medium">{d.request.startup.companyName}</span> →{" "}
                    <span className="font-medium">{d.creator.displayName}</span> · {d.request.title}
                  </span>
                  <span className="text-sm font-medium shrink-0">{formatCents(d.amountCents!)}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">“{d.disputeReason}”</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {d.proofUrl && (
                    <>
                      <a href={d.proofUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        View post
                      </a>
                      {" · "}
                    </>
                  )}
                  Brand: {d.request.startup.user.email} · Creator: {d.creator.user.email} · Reported{" "}
                  {d.disputedAt!.toLocaleDateString("en-US")}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <ConfirmActionButton
                    action={releaseDisputedPaymentAction.bind(null, d.id)}
                    successMessage="Released to the creator."
                    title="Release to the creator?"
                    description={`${d.creator.displayName} gets ${formatCents(d.payoutCents!)} (after the platform fee) and the dispute is closed. This can't be undone.`}
                    confirmLabel="Release"
                    pendingLabel="Releasing…"
                    className="text-xs font-medium underline disabled:opacity-50"
                  >
                    Release to creator
                  </ConfirmActionButton>
                  <ConfirmActionButton
                    action={refundDisputedPaymentAction.bind(null, d.id)}
                    successMessage="Refunded to the brand."
                    title="Refund the brand?"
                    description={`${d.request.startup.companyName} gets the full ${formatCents(d.amountCents!)} back and ${d.creator.displayName} isn't paid. This can't be undone.`}
                    confirmLabel="Refund"
                    pendingLabel="Refunding…"
                    className="text-xs font-medium underline disabled:opacity-50"
                  >
                    Refund brand
                  </ConfirmActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Open reports ({openReports.length})</h2>
        {openReports.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Nothing to review.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {openReports.map((r) => (
              <div key={r.id} className="rounded-xl border border-ink/10 px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">
                    <span className="font-medium">{r.reporter ? r.reporter.email : "Automated flag"}</span> reported{" "}
                    <span className="font-medium">{r.reported.email}</span>
                  </span>
                  <span className="text-xs rounded bg-fog text-neutral-700 px-2 py-1 shrink-0 dark:text-neutral-300">
                    {r.reason}
                  </span>
                </div>
                {r.details && <p className="text-sm text-neutral-600 dark:text-neutral-400">{r.details}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">{r.createdAt.toLocaleDateString("en-US")}</span>
                  <ActionButton
                    action={resolveReportAction.bind(null, r.id)}
                    successMessage="Report resolved."
                    className="text-xs text-neutral-500 hover:text-neutral-900 transition disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    Mark resolved
                  </ActionButton>
                  <ActionButton
                    action={dismissReportAction.bind(null, r.id)}
                    successMessage="Report dismissed."
                    className="text-xs text-neutral-400 hover:text-ink transition disabled:opacity-50 dark:text-neutral-500"
                  >
                    Dismiss
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Recent users</h2>
        {recentUsers.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No users yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentUsers.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-ink/10 px-4 py-2 flex items-center justify-between gap-2"
              >
                <span className="text-sm">{u.email}</span>
                <span className="text-xs rounded bg-fog text-neutral-700 px-2 py-1 dark:text-neutral-300">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Recent requests</h2>
        {recentRequests.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No requests yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentRequests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-ink/10 px-4 py-2 flex items-center justify-between gap-2"
              >
                <span className="text-sm">
                  {r.startup.companyName} · {r.title}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{r._count.interests} interested</span>
                  <span className="text-xs rounded bg-fog text-neutral-700 px-2 py-1 dark:text-neutral-300">
                    {r.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Recent payments</h2>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No payments yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentPayments.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-ink/10 px-4 py-2 flex items-center justify-between gap-2"
              >
                <span className="text-sm">
                  {p.request.startup.companyName} → {p.creator.displayName}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatCents(p.amountCents!)}</span>
                  <span className="text-xs rounded bg-fog text-neutral-700 px-2 py-1 dark:text-neutral-300">
                    {p.paymentStatus}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
