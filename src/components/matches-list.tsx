"use client";

import { useMemo, useState } from "react";
import { RequestCard } from "@/components/request-card";
import { Select } from "@/components/select";

export type MatchGroup = "open" | "chat" | "paid" | "closed";

export type MatchEntry = React.ComponentProps<typeof RequestCard> & {
  group: MatchGroup;
  // Sort keys: the amount in cents (offer, else the request's budget) and
  // when the match started.
  amountCents: number | null;
  matchedAt: number;
};

const FILTERS: { value: MatchGroup | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "chat", label: "In chat" },
  { value: "paid", label: "Paid" },
];

// The creator's matches as a work list: filtered by where each one stands
// and sorted by date or amount.
export function MatchesList({ matches }: { matches: MatchEntry[] }) {
  const [filter, setFilter] = useState<MatchGroup | "all">("all");
  const [sort, setSort] = useState<"newest" | "amount">("newest");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: matches.length };
    for (const m of matches) c[m.group] = (c[m.group] ?? 0) + 1;
    return c;
  }, [matches]);

  const shown = useMemo(() => {
    const list = filter === "all" ? matches : matches.filter((m) => m.group === filter);
    return [...list].sort((a, b) =>
      sort === "amount" ? (b.amountCents ?? -1) - (a.amountCents ?? -1) : b.matchedAt - a.matchedAt,
    );
  }, [matches, filter, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter matches" className="flex gap-1 rounded bg-fog p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition ${
                filter === f.value
                  ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-ink dark:text-neutral-400"
              }`}
            >
              {f.label}
              <span className="text-xs tabular-nums opacity-60">{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "amount")}
          wrapperClassName="w-44"
          aria-label="Sort matches"
        >
          <option value="newest">Newest first</option>
          <option value="amount">Highest amount</option>
        </Select>
      </div>

      {shown.length === 0 ? (
        <p className="rounded bg-fog px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Nothing here right now.
        </p>
      ) : (
        <div className="divide-y divide-ink/10 overflow-hidden rounded bg-fog">
          {shown.map(({ group, amountCents, ...card }) => {
            void group;
            void amountCents;
            return <RequestCard key={card.interestId} {...card} />;
          })}
        </div>
      )}
    </div>
  );
}
