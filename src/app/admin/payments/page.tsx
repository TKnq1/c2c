import Link from "next/link";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { FiCreditCard } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { formatCents } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { LocalDate } from "@/components/local-date";
import { PaymentStatusBadge, type PaymentStage } from "@/components/payment-status-badge";
import { paymentStage } from "@/lib/payment-stage";
import { FilterTabs, ListSearch, Pagination, firstParams, pageFrom } from "@/components/admin/list-controls";

const PATH = "/admin/payments";
const PAGE_SIZE = 25;

// The stages a payment moves through, each mapped to the query that finds
// it. SUBMITTED and DISPUTED aren't stored statuses (the money is HELD
// throughout); they're derived the same way paymentStage does it.
const STAGES: { value: PaymentStage; label: string; where: Prisma.InterestWhereInput }[] = [
  { value: "OFFERED", label: "Offer pending", where: { paymentStatus: "OFFERED" } },
  { value: "ACCEPTED", label: "Awaiting payment", where: { paymentStatus: "ACCEPTED" } },
  { value: "HELD", label: "In escrow", where: { paymentStatus: "HELD", proofSubmittedAt: null, disputedAt: null } },
  {
    value: "SUBMITTED",
    label: "Awaiting approval",
    where: { paymentStatus: "HELD", proofSubmittedAt: { not: null }, disputedAt: null },
  },
  { value: "DISPUTED", label: "Under review", where: { paymentStatus: "HELD", disputedAt: { not: null } } },
  { value: "RELEASED", label: "Released", where: { paymentStatus: "RELEASED" } },
  { value: "REFUNDED", label: "Refunded", where: { paymentStatus: "REFUNDED" } },
];

// The date that matters for each stage: when it got there.
function stageDate(p: {
  offeredAt: Date | null;
  acceptedAt: Date | null;
  paidAt: Date | null;
  proofSubmittedAt: Date | null;
  disputedAt: Date | null;
  releasedAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
}, stage: PaymentStage) {
  const byStage: Record<PaymentStage, Date | null> = {
    OFFERED: p.offeredAt,
    ACCEPTED: p.acceptedAt,
    HELD: p.paidAt,
    SUBMITTED: p.proofSubmittedAt,
    DISPUTED: p.disputedAt,
    RELEASED: p.releasedAt,
    REFUNDED: p.refundedAt,
  };
  return byStage[stage] ?? p.createdAt;
}

export default async function AdminPaymentsPage(props: PageProps<"/admin/payments">) {
  await requireAdminSession();
  const params = firstParams(await props.searchParams);
  const page = pageFrom(params.page);
  const stage = STAGES.find((s) => s.value === params.status);
  const q = params.q?.trim();

  const where: Prisma.InterestWhereInput = {
    AND: [
      stage ? stage.where : { paymentStatus: { not: null } },
      q
        ? {
            OR: [
              { request: { title: { contains: q, mode: "insensitive" } } },
              { request: { startup: { companyName: { contains: q, mode: "insensitive" } } } },
              { creator: { displayName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {},
    ],
  };

  const [payments, total, totals, stageCounts] = await Promise.all([
    prisma.interest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        creator: { select: { displayName: true, userId: true } },
        request: { select: { title: true, startup: { select: { companyName: true, userId: true } } } },
      },
    }),
    prisma.interest.count({ where }),
    prisma.interest.aggregate({ where, _sum: { amountCents: true, platformFeeCents: true } }),
    Promise.all(STAGES.map((s) => prisma.interest.count({ where: s.where }))),
  ]);
  const allCount = stageCounts.reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Payments</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Every offer and payment between brands and creators, from first offer to payout.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <FilterTabs
          path={PATH}
          params={params}
          name="status"
          options={[
            { value: undefined, label: "All", count: allCount },
            ...STAGES.map((s, i) => ({ value: s.value, label: s.label, count: stageCounts[i] })),
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-footnote tabular-nums text-neutral-500 dark:text-neutral-400">
            {formatCents(totals._sum.amountCents ?? 0)} in these payments · {formatCents(totals._sum.platformFeeCents ?? 0)}{" "}
            in fees
          </p>
          <ListSearch path={PATH} params={params} placeholder="Search brand, creator or request" />
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={FiCreditCard} title="No payments found" description="Try another search or filter." />
      ) : (
        <ul className="rounded bg-fog">
          {payments.map((p) => {
            const current = paymentStage({ ...p, paymentStatus: p.paymentStatus as PaymentStatus });
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 border-ink/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between [&+&]:border-t"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <Link href={`/admin/users/${p.request.startup.userId}`} className="hover:underline">
                      {p.request.startup.companyName}
                    </Link>
                    {" → "}
                    <Link href={`/admin/users/${p.creator.userId}`} className="hover:underline">
                      {p.creator.displayName}
                    </Link>
                  </p>
                  <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">
                    {p.request.title} · <LocalDate ms={stageDate(p, current).getTime()} />
                    {p.disputeReason && current === "DISPUTED" && ` · “${p.disputeReason}”`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-right">
                    <span className="block text-sm font-medium tabular-nums">
                      {p.amountCents !== null ? formatCents(p.amountCents) : "–"}
                    </span>
                    {p.platformFeeCents !== null && (
                      <span className="block text-footnote tabular-nums text-neutral-500 dark:text-neutral-400">
                        {formatCents(p.platformFeeCents)} fee
                      </span>
                    )}
                  </span>
                  <PaymentStatusBadge status={current} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination path={PATH} params={params} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
