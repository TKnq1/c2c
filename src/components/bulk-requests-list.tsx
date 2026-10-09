"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { bulkCloseRequestsAction } from "@/lib/actions/requests";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import { LocalDate } from "@/components/local-date";
import { useI18n } from "@/components/i18n-provider";
import { nicheLabel } from "@/lib/i18n/labels";

type RequestEntry = {
  id: string;
  title: string;
  niche: string;
  minFollowers: number;
  budget: string | null;
  // For sorting by budget; the low end of the range.
  budgetMinCents: number | null;
  status: "OPEN" | "CLOSED" | "DRAFT";
  interestCount: number;
  coverUrl: string | null;
  createdAt: number;
};

type SortKey = "title" | "status" | "interest" | "budget" | "created";
type Sort = { key: SortKey; dir: "asc" | "desc" } | null;

// A draft isn't a request yet: it opens in the form, where it can be finished and posted.
const hrefFor = (r: RequestEntry) => (r.status === "DRAFT" ? `/dashboard/startup/requests/${r.id}/edit` : `/dashboard/startup/requests/${r.id}`);

const CHECKBOX =
  "h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white";

const COMPARE: Record<SortKey, (a: RequestEntry, b: RequestEntry) => number> = {
  title: (a, b) => a.title.localeCompare(b.title),
  status: (a, b) => a.status.localeCompare(b.status),
  interest: (a, b) => a.interestCount - b.interestCount,
  // Requests without a budget sort after every amount, either way round.
  budget: (a, b) => (a.budgetMinCents ?? Infinity) - (b.budgetMinCents ?? Infinity),
  created: (a, b) => a.createdAt - b.createdAt,
};

// A brand's requests. Phones: one row each, as before. From md: a table
// whose column headers sort it (on top of the order the page's own sort
// already gave it). Open ones can be selected and closed together.
export function BulkRequestsList({ requests }: { requests: RequestEntry[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [closing, setClosing] = useState(false);
  const [sort, setSort] = useState<Sort>(null);

  const sorted = useMemo(() => {
    if (!sort) return requests;
    const compare = COMPARE[sort.key];
    return [...requests].sort((a, b) => (sort.dir === "asc" ? compare(a, b) : compare(b, a)));
  }, [requests, sort]);

  const openIds = requests.filter((r) => r.status === "OPEN").map((r) => r.id);
  const titleOf = (r: RequestEntry) => r.title.trim() || t("screens.requests.untitledDraft");
  const statusLabel = (r: RequestEntry) =>
    r.status === "OPEN" ? t("screens.requests.open") : r.status === "DRAFT" ? t("screens.requests.draft") : t("screens.requests.closed");
  const allOpenSelected = openIds.length > 0 && openIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Numbers and dates start high-to-low on the first click, text A–Z.
  function sortBy(key: SortKey) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "title" || key === "status" ? "asc" : "desc" },
    );
  }

  async function handleBulkClose() {
    const count = selected.size;
    if (count === 0) return;
    // No confirm dialog, matching the single-request "Close request" button
    // elsewhere — closing is reversible via "Reopen request", not destructive.
    setClosing(true);
    try {
      await bulkCloseRequestsAction([...selected]);
      toast.success(
        count === 1
          ? t("screens.requests.closedOne", { count })
          : t("screens.requests.closedMany", { count }),
      );
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setClosing(false);
    }
  }

  const header = (key: SortKey, label: string, align: "left" | "right", width = "") => (
    <th
      scope="col"
      aria-sort={sort?.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-2.5 font-normal ${align === "right" ? "text-right" : "text-left"} ${width}`}
    >
      <button
        type="button"
        onClick={() => sortBy(key)}
        className={`inline-flex items-center gap-1 transition hover:text-ink ${sort?.key === key ? "text-ink" : ""}`}
      >
        {label}
        {sort?.key === key &&
          (sort.dir === "asc" ? <IoChevronUp className="h-3 w-3" aria-hidden /> : <IoChevronDown className="h-3 w-3" aria-hidden />)}
      </button>
    </th>
  );

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="no-print flex items-center gap-3 rounded bg-ink/10 px-4 py-3">
          <p className="text-sm font-medium flex-1">{t("screens.requests.selected", { count: selected.size })}</p>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            {t("screens.requests.clearSelection")}
          </button>
          <button
            type="button"
            onClick={handleBulkClose}
            disabled={closing}
            className="rounded-full bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
          >
            {closing ? t("screens.requests.closing") : t("screens.requests.closeSelected")}
          </button>
        </div>
      )}

      {/* Phones: one grey group, a row per request. */}
      <div className="divide-y divide-ink/10 overflow-hidden rounded bg-fog md:hidden">
        {sorted.map((r) => (
          <div
            key={r.id}
            className={`flex items-stretch gap-1 transition hover:bg-ink/5 ${r.status === "CLOSED" ? "opacity-60 hover:opacity-100" : ""}`}
          >
            {r.status === "OPEN" && (
              <div className="flex items-center pl-4">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  aria-label={t("screens.requests.select", { title: r.title })}
                  className={CHECKBOX}
                />
              </div>
            )}
            <Link
              href={hrefFor(r)}
              className={`flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 ${r.status === "OPEN" ? "pl-3" : "pl-4"}`}
            >
              {r.coverUrl && (
                // Served by our own image route; nothing for next/image to do.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.coverUrl} alt="" loading="lazy" className="aspect-[4/5] w-12 shrink-0 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold flex items-center gap-2">
                  {titleOf(r)}
                  {r.status !== "OPEN" && (
                    <span className="text-xs font-normal rounded bg-paper text-neutral-500 px-2 py-0.5 dark:text-neutral-400">
                      {statusLabel(r)}
                    </span>
                  )}
                </p>
                <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">
                  {nicheLabel(t, r.niche)} · {r.budget ? `${r.budget} · ` : ""}
                  {t("screens.requests.minFollowersLine", { count: r.minFollowers.toLocaleString(locale) })}
                </p>
                {/* Its own line: at the end of the one above it was the part a phone cut off. */}
                <p className={`text-footnote ${r.interestCount > 0 ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}>
                  {t("screens.requests.interestedCount", { count: r.interestCount })}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* From md: a sortable table. The whole row opens the request; the
          checkbox cell stops that click. */}
      <div className="hidden overflow-hidden rounded bg-fog md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-ink/10 text-footnote text-neutral-500 dark:text-neutral-400">
            <tr>
              <th scope="col" className="w-10 py-2.5 pl-4">
                <input
                  type="checkbox"
                  checked={allOpenSelected}
                  disabled={openIds.length === 0}
                  onChange={() => setSelected(allOpenSelected ? new Set() : new Set(openIds))}
                  aria-label={t("screens.requests.selectAll")}
                  className={CHECKBOX}
                />
              </th>
              {header("title", t("screens.requests.request"), "left")}
              {header("status", t("screens.requests.status"), "left", "w-28")}
              {header("interest", t("screens.requests.interested"), "right", "w-28")}
              {header("budget", t("screens.requests.budget"), "right", "w-36")}
              {header("created", t("screens.requests.created"), "right", "w-36 pr-4")}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {sorted.map((r) => (
              <tr
                key={r.id}
                onClick={() => router.push(hrefFor(r))}
                className={`cursor-pointer transition hover:bg-ink/5 ${r.status === "CLOSED" ? "text-neutral-500 dark:text-neutral-400" : ""}`}
              >
                <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                  {r.status === "OPEN" && (
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={t("screens.requests.select", { title: r.title })}
                      className={CHECKBOX}
                    />
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {r.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverUrl} alt="" loading="lazy" className="aspect-[4/5] w-8 shrink-0 rounded object-cover" />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={hrefFor(r)}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate font-semibold text-ink hover:underline"
                      >
                        {titleOf(r)}
                      </Link>
                      <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">
                        {nicheLabel(t, r.niche)} · {t("screens.requests.minFollowersLine", { count: r.minFollowers.toLocaleString(locale) })}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "OPEN" ? "border border-ink text-ink" : r.status === "DRAFT" ? "border border-dashed border-ink/40" : "bg-ink/10"
                    }`}
                  >
                    {statusLabel(r)}
                  </span>
                </td>
                <td className={`px-3 py-3 text-right tabular-nums ${r.interestCount > 0 ? "font-semibold text-ink" : ""}`}>
                  {r.interestCount}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{r.budget ?? "–"}</td>
                <td className="whitespace-nowrap py-3 pr-4 pl-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                  <LocalDate ms={r.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
