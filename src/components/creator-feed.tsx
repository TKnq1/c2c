"use client";

import { useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import { LANGUAGES } from "@/lib/constants";
import { useUrlState } from "@/lib/use-url-state";
import { MultiSelect } from "@/components/multi-select";
import { SearchInput } from "@/components/search-input";
import { RequestCard } from "@/components/request-card";
import { EmptyState } from "@/components/empty-state";
import { SavedFilters } from "@/components/saved-filters";
import { SwipeCardStack } from "@/components/swipe-card-stack";

type RequestEntry = {
  id: string;
  title: string;
  description: string;
  niche: string;
  languages: string[];
  minFollowers: number;
  productCategory: string;
  companyName: string;
  companyAvatarUrl: string | null;
  interestId: string | null;
  contactedByStartup: boolean;
};

type SavedFilterEntry = { id: string; name: string; query: string };

export function CreatorFeed({
  requests,
  savedFilters,
}: {
  requests: RequestEntry[];
  savedFilters: SavedFilterEntry[];
}) {
  const [{ q: search, language }, setParam, setParams] = useUrlState(["q", "language"]);
  const selectedLanguages = useMemo(() => (language ? language.split(",") : []), [language]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (selectedLanguages.length > 0 && !r.languages.some((l) => selectedLanguages.includes(l))) return false;
      if (query) {
        const haystack = `${r.title} ${r.description} ${r.productCategory} ${r.companyName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [requests, search, selectedLanguages]);

  // Undecided requests are the swipeable stack; anything with an interest
  // already (yours, or the brand reaching out first) isn't a fresh
  // decision anymore, so it moves to a plain list below instead.
  const undecided = useMemo(() => filtered.filter((r) => r.interestId === null), [filtered]);
  const matched = useMemo(() => filtered.filter((r) => r.interestId !== null), [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search title, category, brand…"
          aria-label="Search requests"
          wrapperClassName="flex-1 min-w-48"
        />
        <MultiSelect
          label="All languages"
          options={LANGUAGES}
          selected={selectedLanguages}
          onChange={(vals) => setParam("language", vals.join(","))}
          wrapperClassName="w-44"
        />
      </div>

      <SavedFilters scope="creator-feed" savedFilters={savedFilters} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title="No matching requests."
          description="Nothing matches your search and filters."
          action={{ label: "Clear filters", onClick: () => setParams({ q: "", language: "" }) }}
        />
      ) : (
        <>
          {/* key resets the stack's local state when filters change the underlying set */}
          <SwipeCardStack key={undecided.map((r) => r.id).join(",")} requests={undecided} />

          {matched.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Your matches</h2>
              <div className="flex flex-col gap-4">
                {matched.map((r) => (
                  <RequestCard key={r.id} {...r} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
