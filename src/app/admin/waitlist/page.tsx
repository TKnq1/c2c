import type { Prisma } from "@prisma/client";
import { FiDownload, FiMail } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { removeWaitlistEntryAction } from "@/lib/actions/waitlist";
import { EmptyState } from "@/components/empty-state";
import { RelativeTime } from "@/components/relative-time";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { StatTile } from "@/components/admin/stat-tile";
import { FilterTabs, ListSearch, Pagination, firstParams, pageFrom } from "@/components/admin/list-controls";

const PATH = "/admin/waitlist";
const PAGE_SIZE = 50;

// The emails left on comtor.app to hear when the iOS and Android apps are
// out (see WaitlistForm). The CSV is for the launch email; Remove is for
// anyone who asks to be taken off, as the privacy policy promises.
export default async function AdminWaitlistPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();
  const params = firstParams(await props.searchParams);
  const page = pageFrom(params.page);
  const side = params.side === "creator" ? "CREATOR" : params.side === "brand" ? "STARTUP" : undefined;
  const q = params.q?.trim();

  const where: Prisma.WaitlistEntryWhereInput = {
    ...(side && { role: side }),
    ...(q && { email: { contains: q, mode: "insensitive" } }),
  };

  const [entries, total, all, creators, brands] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.waitlistEntry.count({ where }),
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { role: "CREATOR" } }),
    prisma.waitlistEntry.count({ where: { role: "STARTUP" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-title-1 font-bold">Waitlist</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Emails left on comtor.app to hear when the iOS and Android apps are out. Nobody has been emailed yet.
          </p>
        </div>
        {all > 0 && (
          <a
            href="/api/admin/waitlist"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite sm:self-auto"
          >
            <FiDownload className="h-4 w-4" aria-hidden />
            Download CSV
          </a>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="On the list" value={all.toLocaleString("en-US")} />
        <StatTile label="Creators" value={creators.toLocaleString("en-US")} />
        <StatTile label="Brands" value={brands.toLocaleString("en-US")} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          path={PATH}
          params={params}
          name="side"
          options={[
            { value: undefined, label: "All", count: all },
            { value: "creator", label: "Creators", count: creators },
            { value: "brand", label: "Brands", count: brands },
          ]}
        />
        <ListSearch path={PATH} params={params} placeholder="Search email" />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={FiMail}
          title={all === 0 ? "Nobody yet" : "No one found"}
          description={all === 0 ? "Emails left on comtor.app show up here." : "Try another search or filter."}
        />
      ) : (
        <ul className="rounded bg-fog">
          {entries.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-ink/10 px-4 py-3 md:grid-cols-[minmax(0,1fr)_6rem_8rem_auto] [&+&]:border-t"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{e.email}</span>
                <span className="block text-footnote text-neutral-500 md:hidden dark:text-neutral-400">
                  {e.role === "STARTUP" ? "Brand · " : e.role === "CREATOR" ? "Creator · " : ""}
                  <RelativeTime ms={e.createdAt.getTime()} />
                </span>
              </span>
              <span className="hidden text-footnote text-neutral-500 md:block dark:text-neutral-400">
                {e.role === "STARTUP" ? "Brand" : e.role === "CREATOR" ? "Creator" : ""}
              </span>
              <span className="hidden text-footnote tabular-nums text-neutral-500 md:block dark:text-neutral-400">
                <RelativeTime ms={e.createdAt.getTime()} />
              </span>
              <ConfirmActionButton
                action={removeWaitlistEntryAction.bind(null, e.id)}
                successMessage="Removed from the waitlist."
                title="Remove from the waitlist?"
                description={`${e.email} is deleted and won't get the launch email. This can't be undone.`}
                confirmLabel="Remove"
                pendingLabel="Removing…"
                className="justify-self-end text-footnote text-neutral-500 transition hover:text-ink disabled:opacity-50 dark:text-neutral-400"
              >
                Remove
              </ConfirmActionButton>
            </li>
          ))}
        </ul>
      )}

      <Pagination path={PATH} params={params} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
