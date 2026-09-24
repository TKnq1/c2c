"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { NICHES, PLATFORMS, LANGUAGES } from "@/lib/constants";
import { useUrlState } from "@/lib/use-url-state";
import { Select } from "@/components/select";
import { MultiSelect } from "@/components/multi-select";
import { SearchInput } from "@/components/search-input";
import { CreatorCard } from "@/components/creator-card";
import { EmptyState } from "@/components/empty-state";
import { computeRelevanceScore } from "@/lib/relevance";

type CreatorEntry = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  niche: string;
  bio: string | null;
  contentLanguage: string | null;
  platforms: { platform: string; followerCount: number }[];
  rating: { average: number; count: number };
  completedCollabs: number;
  isFavorited: boolean;
  createdAt: number;
  responseTimeMs: number | null;
  responseTimeLabel: string | null;
};

const SORTS = {
  best: "Best match",
  followers: "Most followers",
  rating: "Highest rated",
  newest: "Newest",
} as const;
type SortKey = keyof typeof SORTS;

function maxFollowers(c: CreatorEntry) {
  return c.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
}

export function DiscoverCreators({ creators }: { creators: CreatorEntry[] }) {
  const [
    { q: search, niche, platform, language, minFollowers, sort: sortParam, favorites },
    setParam,
    setParams,
  ] = useUrlState(["q", "niche", "platform", "language", "minFollowers", "sort", "favorites"]);
  const sort = (sortParam || "best") as SortKey;
  const niches = useMemo(() => (niche ? niche.split(",") : []), [niche]);
  const platformFilters = useMemo(() => (platform ? platform.split(",") : []), [platform]);
  const languages = useMemo(() => (language ? language.split(",") : []), [language]);

  // Mirrors each FavoriteButton's own optimistic state, updated the instant
  // a star is clicked — not just once revalidatePath's background refetch
  // eventually replaces the `creators` prop. Without this, the "favorites
  // only" filter and each card's star only agreed again after that
  // round-trip landed, which read as the card taking a while to disappear.
  const [favoritedIds, setFavoritedIds] = useState(
    () => new Set(creators.filter((c) => c.isFavorited).map((c) => c.id)),
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
    const min = minFollowers === "" ? 0 : Number(minFollowers);
    const query = search.trim().toLowerCase();

    const results = creators.filter((c) => {
      if (favorites === "1" && !favoritedIds.has(c.id)) return false;
      if (niches.length > 0 && !niches.includes(c.niche)) return false;
      if (platformFilters.length > 0 && !c.platforms.some((p) => platformFilters.includes(p.platform))) return false;
      if (languages.length > 0 && !languages.includes(c.contentLanguage ?? "")) return false;
      if (maxFollowers(c) < min) return false;
      if (query) {
        const haystack = `${c.displayName} ${c.niche} ${c.bio ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    if (sort === "followers") return [...results].sort((a, b) => maxFollowers(b) - maxFollowers(a));
    if (sort === "rating") return [...results].sort((a, b) => b.rating.average - a.rating.average);
    if (sort === "newest") return [...results].sort((a, b) => b.createdAt - a.createdAt);
    // "best" — a real weighted score (rating, track record, responsiveness,
    // recency), not just createdAt in disguise.
    return [...results].sort((a, b) => computeRelevanceScore(b) - computeRelevanceScore(a));
  }, [creators, search, niches, platformFilters, languages, minFollowers, sort, favorites, favoritedIds]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search name, niche, bio…"
          aria-label="Search creators"
          wrapperClassName="flex-1 min-w-48"
        />
        <MultiSelect
          label="All niches"
          options={NICHES}
          selected={niches}
          onChange={(vals) => setParam("niche", vals.join(","))}
          wrapperClassName="w-40"
        />
        <MultiSelect
          label="All platforms"
          options={PLATFORMS}
          selected={platformFilters}
          onChange={(vals) => setParam("platform", vals.join(","))}
          wrapperClassName="w-40"
        />
        <MultiSelect
          label="All languages"
          options={LANGUAGES}
          selected={languages}
          onChange={(vals) => setParam("language", vals.join(","))}
          wrapperClassName="w-40"
        />
        <input
          type="number"
          min={0}
          value={minFollowers}
          onChange={(e) => setParam("minFollowers", e.target.value)}
          placeholder="Min. followers"
          aria-label="Minimum followers"
          className="rounded-lg border border-neutral-300 px-3 py-2 w-36 dark:border-neutral-700"
        />
        <Select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          wrapperClassName="w-40"
          aria-label="Sort by"
        >
          {Object.entries(SORTS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {filtered.length} creator{filtered.length === 1 ? "" : "s"}
      </p>

      <div
        key={`${search}|${niche}|${platform}|${language}|${minFollowers}|${sort}|${favorites}`}
        className="discover-results-fade"
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={FiSearch}
            title={favorites === "1" ? "No favorites match your filters." : "No creators match your filters."}
            action={{
              label: "Clear filters",
              onClick: () =>
                setParams({ q: "", niche: "", platform: "", language: "", minFollowers: "", sort: "", favorites: "" }),
            }}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <CreatorCard
                key={c.id}
                id={c.id}
                displayName={c.displayName}
                avatarUrl={c.avatarUrl}
                niche={c.niche}
                contentLanguage={c.contentLanguage}
                platforms={c.platforms}
                rating={c.rating}
                isFavorited={favoritedIds.has(c.id)}
                createdAt={c.createdAt}
                responseTimeLabel={c.responseTimeLabel}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
