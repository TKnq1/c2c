"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { IoFilterOutline } from "react-icons/io5";
import { NICHES } from "@/lib/constants";
import { useUrlState } from "@/lib/use-url-state";
import { useExitAnimation } from "@/lib/use-exit-animation";
import { SearchInput } from "@/components/search-input";
import { BrandCard } from "@/components/brand-card";
import { EmptyState } from "@/components/empty-state";
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

export function DiscoverBrands({ brands }: { brands: BrandEntry[] }) {
  const [{ q: search, niche, favorites }, setParam, setParams] = useUrlState(["q", "niche", "favorites"]);
  const niches = useMemo(() => (niche ? niche.split(",") : []), [niche]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanel = useExitAnimation(filterOpen);
  const filterRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = (favorites === "1" ? 1 : 0) + niches.length;

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filterOpen]);

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search company, niche, description…"
          aria-label="Search brands"
          wrapperClassName="flex-1 min-w-40"
        />
        <div ref={filterRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={filterOpen}
            aria-label="Filter brands"
            className={`flex items-center gap-1.5 rounded-[14px] border px-3.5 py-2 text-sm font-medium transition ${
              activeFilterCount > 0
                ? "border-ink bg-ink text-paper"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            <IoFilterOutline className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-paper px-1 text-[10px] font-semibold text-ink">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterPanel.present && (
            <div
              role="menu"
              onAnimationEnd={filterPanel.onExitEnd}
              className={`${
                filterPanel.closing ? "animate-dropdown-out pointer-events-none" : "animate-dropdown-in"
              } absolute right-0 z-20 mt-1 w-52 max-h-96 overflow-y-auto rounded-[14px] border border-ink/10 bg-white py-1 dark:bg-neutral-900`}
            >
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 whitespace-nowrap hover:bg-neutral-50 cursor-pointer dark:text-neutral-300 dark:hover:bg-neutral-800">
                <input
                  type="checkbox"
                  checked={favorites === "1"}
                  onChange={(e) => setParam("favorites", e.target.checked ? "1" : "")}
                  className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
                />
                Favorites only
              </label>
              <div className="my-1 border-t border-ink/10" />
              <p className="px-3 pt-1 pb-1 text-xs font-medium text-neutral-400 dark:text-neutral-500">Niche</p>
              {NICHES.map((n) => (
                <label
                  key={n}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 whitespace-nowrap hover:bg-neutral-50 cursor-pointer dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <input
                    type="checkbox"
                    checked={niches.includes(n)}
                    onChange={() => toggleNiche(n)}
                    className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
                  />
                  {n}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

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
