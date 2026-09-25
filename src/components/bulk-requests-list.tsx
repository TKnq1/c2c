"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkCloseRequestsAction } from "@/lib/actions/requests";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";

type RequestEntry = {
  id: string;
  title: string;
  niche: string;
  minFollowers: number;
  status: "OPEN" | "CLOSED";
  interestCount: number;
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
        <div className="no-print flex items-center gap-3 rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700/50">
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
            className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
          >
            {closing ? "Closing…" : "Close selected"}
          </button>
        </div>
      )}

      {requests.map((r) => (
        <div
          key={r.id}
          className={`rounded-2xl border transition flex items-stretch gap-1 ${
            r.status === "CLOSED"
              ? "border-neutral-100 opacity-60 hover:opacity-100"
              : "border-ink/10 hover:border-neutral-400 dark:hover:border-neutral-600"
          }`}
        >
          {r.status === "OPEN" && (
            <div className="flex items-center pl-4">
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                aria-label={`Select ${r.title}`}
                className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:checked:border-white dark:checked:bg-white"
              />
            </div>
          )}
          <Link
            href={`/dashboard/startup/requests/${r.id}`}
            className={`flex-1 p-4 ${r.status === "OPEN" ? "pl-3" : ""}`}
          >
            <p className="font-medium flex items-center gap-2">
              {r.title}
              {r.status === "CLOSED" && (
                <span className="text-xs font-normal rounded bg-fog text-neutral-500 px-2 py-0.5 dark:text-neutral-400">
                  Closed
                </span>
              )}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {r.niche} · Min. {r.minFollowers.toLocaleString("en-US")} followers ·{" "}
              <span className={r.interestCount > 0 ? "font-semibold text-neutral-900 dark:text-neutral-100" : ""}>
                {r.interestCount} interested
              </span>
            </p>
          </Link>
        </div>
      ))}
    </div>
  );
}
