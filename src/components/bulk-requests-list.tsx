"use client";

import { useState } from "react";
import Link from "next/link";
import { FiImage } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { bulkCloseRequestsAction } from "@/lib/actions/requests";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";

type RequestEntry = {
  id: string;
  title: string;
  niche: string;
  minFollowers: number;
  budget: string | null;
  status: "OPEN" | "CLOSED";
  interestCount: number;
  coverUrl: string | null;
};

export function BulkRequestsList({ requests }: { requests: RequestEntry[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [closing, setClosing] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkClose() {
    const count = selected.size;
    if (count === 0) return;
    // No confirm dialog, matching the single-request "Close request" button
    // elsewhere — closing is reversible via "Reopen request", not destructive.
    setClosing(true);
    try {
      await bulkCloseRequestsAction([...selected]);
      toast.success(`${count} request${count === 1 ? "" : "s"} closed.`);
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="no-print flex items-center gap-3 rounded bg-ink/10 px-4 py-3">
          <p className="text-sm font-medium flex-1">{selected.size} selected</p>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleBulkClose}
            disabled={closing}
            className="rounded-full bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
          >
            {closing ? "Closing…" : "Close selected"}
          </button>
        </div>
      )}

      {/* One grey group: a row per request with its cover photo. */}
      <div className="divide-y divide-ink/10 overflow-hidden rounded bg-fog">
        {requests.map((r) => (
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
                  aria-label={`Select ${r.title}`}
                  className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
                />
              </div>
            )}
            <Link
              href={`/dashboard/startup/requests/${r.id}`}
              className={`flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 ${r.status === "OPEN" ? "pl-3" : "pl-4"}`}
            >
              <div className="flex aspect-[4/5] w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-paper text-neutral-300 dark:text-neutral-600">
                {r.coverUrl ? (
                  // Served by our own image route; nothing for next/image to do.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <FiImage className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold flex items-center gap-2">
                  {r.title}
                  {r.status === "CLOSED" && (
                    <span className="text-xs font-normal rounded bg-paper text-neutral-500 px-2 py-0.5 dark:text-neutral-400">
                      Closed
                    </span>
                  )}
                </p>
                <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">
                  {r.niche} · {r.budget ? `${r.budget} · ` : ""}Min. {r.minFollowers.toLocaleString("en-US")} followers ·{" "}
                  <span className={r.interestCount > 0 ? "font-semibold text-neutral-900 dark:text-neutral-100" : ""}>
                    {r.interestCount} interested
                  </span>
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
