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

  return (
    <div className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-4">
          {filtered.map((r) => (
            <RequestCard key={r.id} {...r} />
          ))}
        </div>
      )}
    </div>
  );
}
