import Link from "next/link";
import type { Prisma, RequestStatus } from "@prisma/client";
import { FiFileText } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { formatBudget } from "@/lib/format";
import { setRequestStatusAction } from "@/lib/actions/admin";
import { EmptyState } from "@/components/empty-state";
import { LocalDate } from "@/components/local-date";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { FilterTabs, ListSearch, Pagination, firstParams, pageFrom } from "@/components/admin/list-controls";

const PATH = "/admin/requests";
const PAGE_SIZE = 25;

export default async function AdminRequestsPage(props: PageProps<"/admin/requests">) {
  await requireAdminSession();
  const params = firstParams(await props.searchParams);
  const page = pageFrom(params.page);
  const status = params.status === "OPEN" || params.status === "CLOSED" ? (params.status as RequestStatus) : undefined;
  const q = params.q?.trim();

  const where: Prisma.RequestWhereInput = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { niche: { contains: q, mode: "insensitive" } },
        { startup: { companyName: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [requests, total, statusCounts] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        startup: { select: { companyName: true, userId: true } },
        _count: { select: { interests: true } },
      },
    }),
    prisma.request.count({ where }),
    prisma.request.groupBy({ by: ["status"], _count: true }),
  ]);
  const countFor = (s: RequestStatus) => statusCounts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Requests</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          What brands are looking for. Close a request to take it out of every creator&apos;s Feed.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          path={PATH}
          params={params}
          name="status"
          options={[
            { value: undefined, label: "All", count: countFor("OPEN") + countFor("CLOSED") },
            { value: "OPEN", label: "Open", count: countFor("OPEN") },
            { value: "CLOSED", label: "Closed", count: countFor("CLOSED") },
          ]}
        />
        <ListSearch path={PATH} params={params} placeholder="Search title, niche or brand" />
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={FiFileText} title="No requests found" description="Try another search or filter." />
      ) : (
        <ul className="rounded bg-fog">
          {requests.map((r) => {
            const budget = formatBudget(r.budgetMinCents, r.budgetMaxCents);
            const open = r.status === "OPEN";
            return (
              <li
                key={r.id}
                className="flex flex-col gap-2 border-ink/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between [&+&]:border-t"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">
                    <Link href={`/admin/users/${r.startup.userId}`} className="underline">
                      {r.startup.companyName}
                    </Link>
                    {` · ${r.niche}`}
                    {budget && ` · ${budget}`}
                    {r.platform && ` · ${r.platform}`}
                    {` · ${r._count.interests} interested · `}
                    <LocalDate ms={r.createdAt.getTime()} />
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      open ? "border border-ink" : "bg-ink/10 text-stone"
                    }`}
                  >
                    {open ? "Open" : "Closed"}
                  </span>
                  <ConfirmActionButton
                    action={setRequestStatusAction.bind(null, r.id, open ? "CLOSED" : "OPEN")}
                    successMessage={open ? "Request closed." : "Request reopened."}
                    title={open ? "Close this request?" : "Reopen this request?"}
                    description={
                      open
                        ? `"${r.title}" leaves every creator's Feed and Discover. Existing conversations and payments carry on.`
                        : `"${r.title}" shows up in matching creators' Feed again.`
                    }
                    confirmLabel={open ? "Close request" : "Reopen"}
                    pendingLabel={open ? "Closing…" : "Reopening…"}
                    className="text-sm underline"
                  >
                    {open ? "Close" : "Reopen"}
                  </ConfirmActionButton>
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
