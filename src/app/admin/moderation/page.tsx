import Link from "next/link";
import type { ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { formatCents } from "@/lib/format";
import { resolveReportAction, dismissReportAction } from "@/lib/actions/moderation";
import { refundDisputedPaymentAction, releaseDisputedPaymentAction } from "@/lib/actions/disputes";
import { ActionButton } from "@/components/action-button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { LocalDate } from "@/components/local-date";
import { FilterTabs, firstParams } from "@/components/admin/list-controls";

const PATH = "/admin/moderation";
const REPORT_STATUSES: ReportStatus[] = ["OPEN", "RESOLVED", "DISMISSED"];
const STATUS_LABELS: Record<ReportStatus, string> = { OPEN: "Open", RESOLVED: "Resolved", DISMISSED: "Dismissed" };

export default async function AdminModerationPage(props: PageProps<"/admin/moderation">) {
  await requireAdminSession();
  const params = firstParams(await props.searchParams);
  const reportStatus = REPORT_STATUSES.includes(params.reports as ReportStatus)
    ? (params.reports as ReportStatus)
    : "OPEN";

  const [disputes, reports, reportCounts] = await Promise.all([
    // Oldest first: that money has been frozen longest.
    prisma.interest.findMany({
      // Brand deals are settled on /admin/deals, where the deal and the money move together.
      where: { paymentStatus: "HELD", disputedAt: { not: null }, deal: { is: null } },
      include: {
        creator: { include: { user: { select: { email: true } } } },
        request: { include: { startup: { include: { user: { select: { email: true } } } } } },
      },
      orderBy: { disputedAt: "asc" },
    }),
    prisma.report.findMany({
      where: { status: reportStatus },
      include: {
        reporter: { select: { id: true, email: true } },
        reported: { select: { id: true, email: true, suspendedAt: true, _count: { select: { reportsReceived: true } } } },
      },
      orderBy: { createdAt: reportStatus === "OPEN" ? "asc" : "desc" },
      take: 100,
    }),
    prisma.report.groupBy({ by: ["status"], _count: true }),
  ]);
  const openDealDisputes = await prisma.dealDispute.count({ where: { status: "OPEN" } });
  const countFor = (s: ReportStatus) => reportCounts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-title-1 font-bold">Moderation</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Disputed payments and reported accounts, oldest first.
        </p>
      </div>

      {openDealDisputes > 0 && (
        <Link href="/admin/deals" className="rounded border border-dashed border-ink px-4 py-3 text-sm font-medium hover:bg-fog">
          {openDealDisputes} Brand-Deal-Streitfälle warten auf eine Entscheidung →
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Disputed payments ({disputes.length})</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            A brand reported a problem with a creator&apos;s post, so the payment is frozen. Check the post, contact both
            sides by email, then release it to the creator or refund the brand.
          </p>
        </div>
        {disputes.length === 0 ? (
          <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Nothing to settle.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {disputes.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 rounded border border-dashed border-ink px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm">
                    <Link href={`/admin/users/${d.request.startup.userId}`} className="font-medium hover:underline">
                      {d.request.startup.companyName}
                    </Link>
                    {" → "}
                    <Link href={`/admin/users/${d.creator.userId}`} className="font-medium hover:underline">
                      {d.creator.displayName}
                    </Link>
                    {` · ${d.request.title}`}
                  </p>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{formatCents(d.amountCents!)}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">“{d.disputeReason}”</p>
                <p className="text-footnote text-neutral-500 dark:text-neutral-400">
                  {d.proofUrl && (
                    <>
                      <a href={d.proofUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        View post
                      </a>
                      {" · "}
                    </>
                  )}
                  Brand: {d.request.startup.user.email} · Creator: {d.creator.user.email} · Reported{" "}
                  <LocalDate ms={d.disputedAt!.getTime()} />
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <ConfirmActionButton
                    action={releaseDisputedPaymentAction.bind(null, d.id)}
                    requirePassword
                    successMessage="Released to the creator."
                    title="Release to the creator?"
                    description={`${d.creator.displayName} gets ${formatCents(d.payoutCents!)} (after the platform fee) and the dispute is closed. This can't be undone.`}
                    confirmLabel="Release"
                    pendingLabel="Releasing…"
                    className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite"
                  >
                    Release to creator
                  </ConfirmActionButton>
                  <ConfirmActionButton
                    action={refundDisputedPaymentAction.bind(null, d.id)}
                    requirePassword
                    successMessage="Refunded to the brand."
                    title="Refund the brand?"
                    description={`${d.request.startup.companyName} gets the full ${formatCents(d.amountCents!)} back and ${d.creator.displayName} isn't paid. This can't be undone.`}
                    confirmLabel="Refund"
                    pendingLabel="Refunding…"
                    className="rounded-full border border-ink px-4 py-2 text-sm font-medium transition hover:bg-fog"
                  >
                    Refund brand
                  </ConfirmActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Reports</h2>
        <FilterTabs
          path={PATH}
          params={{ ...params, reports: reportStatus }}
          name="reports"
          options={REPORT_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], count: countFor(s) }))}
        />
        {reports.length === 0 ? (
          <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            {reportStatus === "OPEN" ? "Nothing to review." : `No ${STATUS_LABELS[reportStatus].toLowerCase()} reports.`}
          </p>
        ) : (
          <ul className="rounded bg-fog">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-col gap-1.5 border-ink/10 px-4 py-3 [&+&]:border-t">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm">
                    {r.reporter ? (
                      <Link href={`/admin/users/${r.reporter.id}`} className="font-medium hover:underline">
                        {r.reporter.email}
                      </Link>
                    ) : (
                      <span className="font-medium">Automated flag</span>
                    )}{" "}
                    reported{" "}
                    <Link href={`/admin/users/${r.reported.id}`} className="font-medium underline">
                      {r.reported.email}
                    </Link>
                    {r.reported.suspendedAt && <span className="ml-1.5 text-xs font-medium">(suspended)</span>}
                  </p>
                  <span className="shrink-0 rounded-full bg-ink/10 px-2.5 py-1 text-xs font-medium">{r.reason}</span>
                </div>
                {r.details && <p className="text-sm text-neutral-600 dark:text-neutral-400">{r.details}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-footnote text-neutral-500 dark:text-neutral-400">
                    <LocalDate ms={r.createdAt.getTime()} />
                    {r.reported._count.reportsReceived > 1 &&
                      ` · ${r.reported._count.reportsReceived} reports about this account in total`}
                  </span>
                  {r.status === "OPEN" && (
                    <>
                      <ActionButton
                        action={resolveReportAction.bind(null, r.id)}
                        successMessage="Report resolved."
                        className="text-sm font-medium underline disabled:opacity-50"
                      >
                        Mark resolved
                      </ActionButton>
                      <ActionButton
                        action={dismissReportAction.bind(null, r.id)}
                        successMessage="Report dismissed."
                        className="text-sm text-neutral-500 underline disabled:opacity-50 dark:text-neutral-400"
                      >
                        Dismiss
                      </ActionButton>
                      {!r.reported.suspendedAt && (
                        <Link href={`/admin/users/${r.reported.id}`} className="text-sm text-neutral-500 underline dark:text-neutral-400">
                          Review account
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
