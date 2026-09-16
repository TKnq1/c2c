import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { resolveReportAction, dismissReportAction } from "@/lib/actions/moderation";
import { PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";

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
  ]);

  const simulatedMrrCents = proSubscribers * PRO_SUBSCRIPTION_PRICE_CENTS;
  const totalVolumeCents = volumeAgg._sum.amountCents ?? 0;
  const platformRevenueCents = releasedFeeAgg._sum.platformFeeCents ?? 0;
  const pendingFeeCents = heldFeeAgg._sum.platformFeeCents ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-normal">Admin overview</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Platform-wide snapshot — mostly read-only, aside from resolving reports below.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Users</p>
          <p className="font-display text-3xl font-normal mt-1">{totalUsers}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {totalStartups} brands · {totalCreators} creators
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Requests</p>
          <p className="font-display text-3xl font-normal mt-1">{totalRequests}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {openRequests} open · {totalInterests} interests expressed
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Commission revenue</p>
          <p className="font-display text-3xl font-normal mt-1">{formatCents(platformRevenueCents)}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {formatCents(pendingFeeCents)} pending in escrow
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Pro subscribers</p>
          <p className="font-display text-3xl font-normal mt-1">{proSubscribers}</p>
          <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
            {formatCents(simulatedMrrCents)}/mo simulated — no real recurring charge
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 p-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Total payment volume</p>
        <p className="font-display text-3xl font-normal mt-1">{formatCents(totalVolumeCents)}</p>
        <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
          Across {volumeCount} non-refunded payments — real escrow via Stripe.
        </p>
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
