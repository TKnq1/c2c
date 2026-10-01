import Link from "next/link";
import { FiAlertTriangle, FiChevronRight } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { formatCents } from "@/lib/format";
import { PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import { dailySeries, windowStart } from "@/lib/admin-stats";
import { StatTile } from "@/components/admin/stat-tile";
import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { PaymentStatusBadge, paymentStage } from "@/components/payment-status-badge";
import { LocalDate } from "@/components/local-date";
import { RoleBadge } from "@/components/admin/role-badge";

const CHART_DAYS = 30;

export default async function AdminOverviewPage() {
  await requireAdminSession();
  const since = windowStart(CHART_DAYS);
  const weekAgo = windowStart(7);

  const [
    usersByRole,
    newUsersThisWeek,
    requestsByStatus,
    collabCount,
    volumeAgg,
    releasedFeeAgg,
    heldFeeAgg,
    proSubscribers,
    openReports,
    openDisputes,
    awaitingApproval,
    signups,
    paidIn,
    recentUsers,
    recentPayments,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.request.groupBy({ by: ["status"], _count: true }),
    prisma.interest.count(),
    // Only HELD/RELEASED is money that actually moved and stayed: offers
    // haven't been paid yet and refunds went back.
    prisma.interest.aggregate({
      where: { paymentStatus: { in: ["HELD", "RELEASED"] } },
      _sum: { amountCents: true },
      _count: true,
    }),
    // Revenue is only what's been kept; fees on HELD payments still depend
    // on the release.
    prisma.interest.aggregate({ where: { paymentStatus: "RELEASED" }, _sum: { platformFeeCents: true } }),
    prisma.interest.aggregate({ where: { paymentStatus: "HELD" }, _sum: { platformFeeCents: true } }),
    prisma.startupProfile.count({ where: { isPro: true } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.interest.count({ where: { paymentStatus: "HELD", disputedAt: { not: null } } }),
    prisma.interest.count({
      where: { paymentStatus: "HELD", proofSubmittedAt: { not: null }, disputedAt: null },
    }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.interest.findMany({
      where: { paidAt: { gte: since } },
      select: { paidAt: true, amountCents: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { startupProfile: true, creatorProfile: true },
    }),
    prisma.interest.findMany({
      where: { paymentStatus: { in: ["HELD", "RELEASED", "REFUNDED"] } },
      include: { creator: true, request: { include: { startup: true } } },
      orderBy: { paidAt: "desc" },
      take: 6,
    }),
  ]);

  const roleCount = (role: string) => usersByRole.find((r) => r.role === role)?._count ?? 0;
  const statusCount = (status: string) => requestsByStatus.find((r) => r.status === status)?._count ?? 0;
  const totalUsers = usersByRole.reduce((sum, r) => sum + r._count, 0);
  const signupSeries = dailySeries(signups, CHART_DAYS, (u) => u.createdAt);
  const volumeSeries = dailySeries(paidIn, CHART_DAYS, (p) => p.paidAt, (p) => p.amountCents ?? 0);
  const attention = openReports + openDisputes;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-title-1 font-bold">Overview</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">How comtor is doing right now.</p>
      </div>

      {attention > 0 && (
        <Link
          href="/admin/moderation"
          className="flex items-center gap-3 rounded border border-ink px-4 py-3 transition hover:bg-fog"
        >
          <FiAlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <span className="flex-1 text-sm">
            <span className="font-medium">Needs your attention: </span>
            {[
              openDisputes > 0 && `${openDisputes} disputed payment${openDisputes === 1 ? "" : "s"}`,
              openReports > 0 && `${openReports} open report${openReports === 1 ? "" : "s"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <FiChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Users"
          value={totalUsers.toLocaleString("en-US")}
          hint={`${roleCount("STARTUP")} brands · ${roleCount("CREATOR")} creators · +${newUsersThisWeek} this week`}
          href="/admin/users"
        />
        <StatTile
          label="Open requests"
          value={statusCount("OPEN").toLocaleString("en-US")}
          hint={`${statusCount("CLOSED")} closed · ${collabCount} conversations started`}
          href="/admin/requests"
        />
        <StatTile
          label="Payment volume"
          value={formatCents(volumeAgg._sum.amountCents ?? 0)}
          hint={`${volumeAgg._count} payments held or released`}
          href="/admin/payments"
        />
        <StatTile
          label="Commission revenue"
          value={formatCents(releasedFeeAgg._sum.platformFeeCents ?? 0)}
          hint={`${formatCents(heldFeeAgg._sum.platformFeeCents ?? 0)} more once escrow is released`}
          href="/admin/payments?status=RELEASED"
        />
        <StatTile
          label="Pro subscribers"
          value={proSubscribers.toLocaleString("en-US")}
          hint={`${formatCents(proSubscribers * PRO_SUBSCRIPTION_PRICE_CENTS)} a month`}
          href="/admin/users?role=STARTUP&pro=1"
        />
        <StatTile
          label="Awaiting brand approval"
          value={awaitingApproval.toLocaleString("en-US")}
          hint="Posts submitted, payment still in escrow"
          href="/admin/payments?status=SUBMITTED"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DailyBarChart
          title={`Sign-ups, last ${CHART_DAYS} days`}
          points={signupSeries}
          unit="count"
          total={`${signups.length.toLocaleString("en-US")} total`}
        />
        <DailyBarChart
          title={`Paid in by brands, last ${CHART_DAYS} days`}
          points={volumeSeries}
          unit="cents"
          total={formatCents(paidIn.reduce((sum, p) => sum + (p.amountCents ?? 0), 0))}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-footnote text-neutral-500 dark:text-neutral-400">Newest users</h2>
            <Link href="/admin/users" className="text-footnote underline">
              All users
            </Link>
          </div>
          <ul className="rounded bg-fog">
            {recentUsers.map((u) => (
              <li key={u.id} className="border-ink/10 [&+&]:border-t">
                <Link
                  href={`/admin/users/${u.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-ink/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {u.startupProfile?.companyName ?? u.creatorProfile?.displayName ?? u.email}
                    </span>
                    <span className="block truncate text-footnote text-neutral-500 dark:text-neutral-400">
                      {u.email} · <LocalDate ms={u.createdAt.getTime()} />
                    </span>
                  </span>
                  <RoleBadge role={u.role} isAdmin={u.isAdmin} suspended={!!u.suspendedAt} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-footnote text-neutral-500 dark:text-neutral-400">Latest payments</h2>
            <Link href="/admin/payments" className="text-footnote underline">
              All payments
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">No payments yet.</p>
          ) : (
            <ul className="rounded bg-fog">
              {recentPayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-ink/10 px-4 py-3 [&+&]:border-t"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {p.request.startup.companyName} → {p.creator.displayName}
                    </span>
                    <span className="block truncate text-footnote text-neutral-500 dark:text-neutral-400">
                      {formatCents(p.amountCents!)} · {p.request.title}
                    </span>
                  </span>
                  <PaymentStatusBadge status={paymentStage({ ...p, paymentStatus: p.paymentStatus! })} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
