"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { NICHES } from "@/lib/constants";
import { useUrlState } from "@/lib/use-url-state";
import { SearchInput } from "@/components/search-input";
import { AppliedFilters, FavoritesFilter, FilterButton, FilterChip, FilterGroup, FilterSheet, searchFieldClass, useFilterSheet } from "@/components/filters";
import { BrandCard } from "@/components/brand-card";
import { EmptyState } from "@/components/empty-state";
import { computeRelevanceScore } from "@/lib/relevance";
import { useI18n } from "@/components/i18n-provider";
import { nicheLabel } from "@/lib/i18n/labels";

type BrandEntry = {
  id: string;
  companyName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
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

export function DiscoverBrands({ brands }: { brands: BrandEntry[] }) {
  const { t } = useI18n();
  const [{ q: search, niche, favorites }, setParam, setParams] = useUrlState(["q", "niche", "favorites"]);
  const niches = useMemo(() => (niche ? niche.split(",") : []), [niche]);
  const sheet = useFilterSheet();
  // Filter groups that narrow the list, saved-only among them (it is the star in the header too).
  const activeFilterCount = (niches.length > 0 ? 1 : 0) + (favorites === "1" ? 1 : 0);

  function toggleNiche(n: string) {
    setParam("niche", (niches.includes(n) ? niches.filter((x) => x !== n) : [...niches, n]).join(","));
  }

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
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder={t("screens.discover.searchBrands")}
          aria-label={t("screens.discover.searchBrandsLabel")}
          wrapperClassName="min-w-0 flex-1"
          className={searchFieldClass}
        />
        <FilterButton
          count={activeFilterCount}
          label={t("screens.discover.filter")}
          activeLabel={t("screens.discover.filtersActive", { count: activeFilterCount })}
          onClick={sheet.show}
        />
      </div>

      <AppliedFilters
        removeLabel={t("common.remove")}
        items={[
          ...(favorites === "1" ? [{ key: "favorites", label: t("screens.discover.favoritesChip"), onRemove: () => setParam("favorites", "") }] : []),
          ...niches.map((n) => ({ key: n, label: nicheLabel(t, n), onRemove: () => toggleNiche(n) })),
        ]}
      />

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {filtered.length === 1
          ? t("screens.discover.brandOne", { count: filtered.length })
          : t("screens.discover.brandMany", { count: filtered.length })}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title={favorites === "1" ? t("screens.discover.noFavoriteBrands") : t("screens.discover.noBrands")}
          action={{ label: t("screens.discover.clearFilters"), onClick: () => setParams({ q: "", niche: "", favorites: "" }) }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((b) => (
            <BrandCard
              key={b.id}
              id={b.id}
              companyName={b.companyName}
              avatarUrl={b.avatarUrl}
              coverUrl={b.coverUrl}
              niche={b.niche}
              rating={b.rating}
              isFavorited={favoritedIds.has(b.id)}
              createdAt={b.createdAt}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

      <FilterSheet
        open={sheet.open}
        onClose={sheet.hide}
        anchor={sheet.anchor}
        title={t("screens.discover.filter")}
        resetLabel={t("screens.discover.resetFilters")}
        onReset={() => setParams({ niche: "", favorites: "" })}
        showLabel={
          filtered.length === 1
            ? t("screens.discover.showBrandsOne", { count: filtered.length })
            : t("screens.discover.showBrandsMany", { count: filtered.length })
        }
      >
        <FavoritesFilter active={favorites === "1"} onToggle={() => setParam("favorites", favorites === "1" ? "" : "1")} label={t("screens.discover.favoritesChip")} />
        <FilterGroup label={t("screens.discover.niche")}>
          {NICHES.map((n) => (
            <FilterChip key={n} active={niches.includes(n)} onClick={() => toggleNiche(n)}>
              {nicheLabel(t, n)}
            </FilterChip>
          ))}
        </FilterGroup>
      </FilterSheet>
    </div>
  );
}
