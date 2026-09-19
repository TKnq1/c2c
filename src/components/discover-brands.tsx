"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { NICHES } from "@/lib/constants";
import { useUrlState } from "@/lib/use-url-state";
import { MultiSelect } from "@/components/multi-select";
import { SearchInput } from "@/components/search-input";
import { BrandCard } from "@/components/brand-card";
import { EmptyState } from "@/components/empty-state";
import { SavedFilters } from "@/components/saved-filters";
import { computeRelevanceScore } from "@/lib/relevance";

type BrandEntry = {
  id: string;
  companyName: string;
  avatarUrl: string | null;
  niche: string | null;
  description: string | null;
  website: string | null;
  socialLinks: { platform: string; url: string }[];
  rating: { average: number; count: number };
  completedCollabs: number;
  isFavorited: boolean;
  createdAt: number;
  responseTimeMs: number | null;
  responseTimeLabel: string | null;
};

type SavedFilterEntry = { id: string; name: string; query: string };

export function DiscoverBrands({
  brands,
  savedFilters,
}: {
  brands: BrandEntry[];
  savedFilters: SavedFilterEntry[];
}) {
  const [{ q: search, niche, favorites }, setParam, setParams] = useUrlState(["q", "niche", "favorites"]);
  const niches = useMemo(() => (niche ? niche.split(",") : []), [niche]);

  // Mirrors each FavoriteButton's own optimistic state — see the identical
  // comment in discover-creators.tsx for why this can't just read b.isFavorited.
  const [favoritedIds, setFavoritedIds] = useState(
    () => new Set(brands.filter((b) => b.isFavorited).map((b) => b.id)),
  );
  const handleFavoriteToggle = (id: string, favorited: boolean) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = brands.filter((b) => {
      if (favorites === "1" && !favoritedIds.has(b.id)) return false;
      if (niches.length > 0 && !niches.includes(b.niche ?? "")) return false;
      if (query) {
        const haystack = `${b.companyName} ${b.niche ?? ""} ${b.description ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    // No sort control here (unlike Discover Creators) — a real weighted
    // relevance score is just the default order instead of raw createdAt.
    return [...results].sort((a, b) => computeRelevanceScore(b) - computeRelevanceScore(a));
  }, [brands, search, niches, favorites, favoritedIds]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search company, niche, description…"
          aria-label="Search brands"
          wrapperClassName="flex-1 min-w-48"
        />
        <MultiSelect
          label="All niches"
          options={NICHES}
          selected={niches}
          onChange={(vals) => setParam("niche", vals.join(","))}
          wrapperClassName="w-40"
        />
      </div>

      <SavedFilters scope="discover-brands" savedFilters={savedFilters} />

      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {filtered.length} brand{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title={favorites === "1" ? "No favorites match your filters." : "No brands match your filters."}
          action={{ label: "Clear filters", onClick: () => setParams({ q: "", niche: "", favorites: "" }) }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((b) => (
            <BrandCard
              key={b.id}
              id={b.id}
              companyName={b.companyName}
              avatarUrl={b.avatarUrl}
              niche={b.niche}
              description={b.description}
              website={b.website}
              socialLinks={b.socialLinks}
              rating={b.rating}
              isFavorited={favoritedIds.has(b.id)}
              createdAt={b.createdAt}
              responseTimeLabel={b.responseTimeLabel}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
