"use client";

import { useMemo, useState } from "react";
import { RequestCard } from "@/components/request-card";
import { FilterChip, FilterChipRow, SortMenu } from "@/components/filters";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

export type MatchGroup = "open" | "chat" | "paid" | "closed";

export type MatchEntry = React.ComponentProps<typeof RequestCard> & {
  group: MatchGroup;
  // Sort keys: the amount in cents (offer, else the request's budget) and
  // when the match started.
  amountCents: number | null;
  matchedAt: number;
};

const FILTERS: { value: MatchGroup | "all"; label: MessageKey }[] = [
  { value: "all", label: "screens.matches.all" },
  { value: "open", label: "screens.matches.open" },
  { value: "chat", label: "screens.matches.inChat" },
  { value: "paid", label: "screens.matches.paid" },
];

// The creator's matches as a work list: filtered by where each one stands
// and sorted by date or amount.
export function MatchesList({ matches }: { matches: MatchEntry[] }) {
  const { t } = useI18n();
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
        <FilterChipRow label={t("screens.matches.filter")}>
          {FILTERS.map((f) => (
            <FilterChip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)} count={counts[f.value] ?? 0}>
              {t(f.label)}
            </FilterChip>
          ))}
        </FilterChipRow>
        <SortMenu
          value={sort}
          onChange={(v) => setSort(v as "newest" | "amount")}
          label={t("screens.matches.sort")}
          options={[
            { value: "newest", label: t("screens.matches.newest") },
            { value: "amount", label: t("screens.matches.highest") },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded bg-fog px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {t("screens.matches.nothing")}
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
