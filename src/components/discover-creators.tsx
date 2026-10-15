"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { FiSearch } from "react-icons/fi";
import { IoChevronDown, IoOptionsOutline, IoStar, IoStarOutline } from "react-icons/io5";
import { NICHES, PLATFORMS, LANGUAGES } from "@/lib/constants";
import { useUrlState } from "@/lib/use-url-state";
import { SearchInput } from "@/components/search-input";
import { CreatorCard } from "@/components/creator-card";
import { EmptyState } from "@/components/empty-state";
import { Dialog } from "@/components/dialog";
import { computeRelevanceScore } from "@/lib/relevance";
import { useI18n } from "@/components/i18n-provider";
import { contentLanguageLabel, nicheLabel } from "@/lib/i18n/labels";
import type { MessageKey } from "@/lib/i18n/translate";
import { formatFollowers } from "@/lib/format";
import { startConversationAsStartupAction } from "@/lib/actions/requests";
import {
  FOLLOWER_STEPS,
  QUICK_PLATFORMS,
  activeFilterCount,
  filtersForRequest,
  matchReasons,
  splitList,
  type DiscoverRequest,
  type MatchReason,
} from "@/lib/discover-filter";

type CreatorEntry = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  niches: string[];
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
  best: "screens.discover.bestMatch",
  followers: "screens.discover.mostFollowers",
  rating: "screens.discover.highestRated",
  newest: "screens.discover.newest",
} as const;
type SortKey = keyof typeof SORTS;

const REASON_KEYS: Record<MatchReason, MessageKey> = {
  niche: "screens.discover.reasonNiche",
  platform: "screens.discover.reasonPlatform",
  reach: "screens.discover.reasonReach",
  language: "screens.discover.reasonLanguage",
};

const FILTER_KEYS = ["q", "niche", "platform", "language", "minFollowers", "sort", "favorites", "request"];

const chip = (active: boolean) =>
  `inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition ${
    active
      ? "bg-ink text-paper"
      : "border border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
  }`;

function maxFollowers(c: CreatorEntry) {
  return c.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
}

// Brand Discover: an open request can set the filters (and each card then says why the creator fits and invites them
// to it), a search with the filters behind one button, quick chips for the common ones, and everything else in a sheet.
export function DiscoverCreators({ creators, requests }: { creators: CreatorEntry[]; requests: DiscoverRequest[] }) {
  const { t } = useI18n();
  const [values, setParam, setParams] = useUrlState(FILTER_KEYS);
  const { q: search, niche, platform, language, minFollowers, sort: sortParam, favorites, request: requestId } = values;
  const sort = (sortParam || "best") as SortKey;
  const nicheFilters = useMemo(() => splitList(niche), [niche]);
  const platformFilters = useMemo(() => splitList(platform), [platform]);
  const languages = useMemo(() => splitList(language), [language]);
  const activeRequest = requests.find((r) => r.id === requestId) ?? null;
  const filterCount = activeFilterCount({ niche, platform, language, minFollowers });
  const [sheetOpen, setSheetOpen] = useState(false);

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
      if (nicheFilters.length > 0 && !c.niches.some((n) => nicheFilters.includes(n))) return false;
      if (platformFilters.length > 0 && !c.platforms.some((p) => platformFilters.includes(p.platform))) return false;
      if (languages.length > 0 && !languages.includes(c.contentLanguage ?? "")) return false;
      if (maxFollowers(c) < min) return false;
      if (query) {
        const haystack = `${c.displayName} ${c.niches.join(" ")} ${c.bio ?? ""}`.toLowerCase();
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
  }, [creators, search, nicheFilters, platformFilters, languages, minFollowers, sort, favorites, favoritedIds]);

  const toggleIn = (key: "niche" | "platform" | "language", list: string[], value: string) =>
    setParam(key, (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]).join(","));

  function pickRequest(id: string) {
    const picked = requests.find((r) => r.id === id);
    setParams(picked ? { request: picked.id, ...filtersForRequest(picked) } : { request: "", niche: "", platform: "", language: "", minFollowers: "" });
  }

  const clearAll = () => setParams(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])));
  const resetFilters = () => setParams({ niche: "", platform: "", language: "", minFollowers: "", sort: "" });

  const nicheChipLabel =
    nicheFilters.length === 0
      ? t("screens.discover.niche")
      : nicheFilters.length === 1
        ? nicheLabel(t, nicheFilters[0])
        : `${nicheLabel(t, nicheFilters[0])} +${nicheFilters.length - 1}`;
  const minCount = Number(minFollowers) || 0;
  const countLabel =
    filtered.length === 1
      ? t("screens.discover.creatorOne", { count: filtered.length })
      : t("screens.discover.creatorMany", { count: filtered.length });

  return (
    <div className="flex flex-col gap-4">
      {requests.length > 0 && (
        <label
          className={`relative flex min-h-14 cursor-pointer items-center gap-3 rounded px-4 py-2.5 transition ${
            activeRequest ? "bg-ink text-paper" : "bg-fog"
          }`}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={`text-xs ${activeRequest ? "text-paper/70" : "text-neutral-500 dark:text-neutral-400"}`}>
              {t("screens.discover.forRequest")}
            </span>
            <span className="truncate font-medium">{activeRequest?.title ?? t("screens.discover.anyRequest")}</span>
          </span>
          <IoChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          {/* The native picker: a wheel on phones, a list on desktop. Invisible over the whole bar, so the bar is the button. */}
          <select
            value={activeRequest?.id ?? ""}
            onChange={(e) => pickRequest(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="">{t("screens.discover.anyRequest")}</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex gap-2">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder={t("screens.discover.searchCreators")}
          aria-label={t("screens.discover.searchCreatorsLabel")}
          wrapperClassName="min-w-0 flex-1"
          className="min-h-11 border-transparent bg-fog dark:border-transparent"
        />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={filterCount > 0 ? t("screens.discover.filtersActive", { count: filterCount }) : t("screens.discover.filter")}
          className="relative flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded border border-neutral-300 px-3 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
        >
          <IoOptionsOutline className="h-5 w-5" aria-hidden />
          <span className="hidden md:inline">{t("screens.discover.filter")}</span>
          {filterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-paper">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* One swipeable row on phones (running to the screen edge), wrapping from md up. */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setSheetOpen(true)} className={chip(nicheFilters.length > 0)}>
          {nicheChipLabel}
          <IoChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        {QUICK_PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={platformFilters.includes(p)}
            onClick={() => toggleIn("platform", platformFilters, p)}
            className={chip(platformFilters.includes(p))}
          >
            {p}
          </button>
        ))}
        <button type="button" onClick={() => setSheetOpen(true)} className={chip(minCount > 0)}>
          {minCount > 0 ? t("screens.discover.followersCount", { count: formatFollowers(minCount) }) : t("screens.discover.followers")}
          <IoChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        {languages.length > 0 && (
          <button type="button" onClick={() => setSheetOpen(true)} className={chip(true)}>
            {languages.map((l) => contentLanguageLabel(t, l)).join(", ")}
            <IoChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          aria-pressed={favorites === "1"}
          onClick={() => setParam("favorites", favorites === "1" ? "" : "1")}
          className={chip(favorites === "1")}
        >
          {favorites === "1" ? <IoStar className="h-4 w-4" aria-hidden /> : <IoStarOutline className="h-4 w-4" aria-hidden />}
          {t("screens.discover.favoritesChip")}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{countLabel}</p>
        <label className="relative flex min-h-11 items-center gap-1 text-sm font-medium">
          <span className="sr-only">{t("screens.discover.sortBy")}</span>
          <span aria-hidden>{t(SORTS[sort])}</span>
          <IoChevronDown className="h-3.5 w-3.5" aria-hidden />
          <select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            {Object.entries(SORTS).map(([key, label]) => (
              <option key={key} value={key}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div key={`${search}|${niche}|${platform}|${language}|${minFollowers}|${sort}|${favorites}|${requestId}`} className="discover-results-fade">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FiSearch}
            title={favorites === "1" ? t("screens.discover.noFavoriteCreators") : t("screens.discover.noCreators")}
            action={{ label: t("screens.discover.clearFilters"), onClick: clearAll }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => {
              const card = (
                <CreatorCard
                  id={c.id}
                  displayName={c.displayName}
                  avatarUrl={c.avatarUrl}
                  niches={c.niches}
                  platforms={c.platforms}
                  rating={c.rating}
                  isFavorited={favoritedIds.has(c.id)}
                  createdAt={c.createdAt}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              );
              if (!activeRequest) return <div key={c.id}>{card}</div>;
              const reasons = matchReasons(c, activeRequest);
              const chatId = activeRequest.chats[c.id];
              return (
                <div key={c.id} className="flex h-full flex-col gap-2">
                  {card}
                  {reasons.length > 0 && (
                    <p className="px-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                      {t("screens.discover.matchLine", { reasons: reasons.map((r) => t(REASON_KEYS[r])).join(", ") })}
                    </p>
                  )}
                  {chatId ? (
                    <Link
                      href={`/dashboard/messages/${chatId}`}
                      className="mt-auto flex min-h-10 items-center justify-center rounded-full border border-neutral-300 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
                    >
                      {t("screens.discover.inChat")}
                    </Link>
                  ) : (
                    <form action={startConversationAsStartupAction.bind(null, c.id)} className="mt-auto">
                      <input type="hidden" name="requestId" value={activeRequest.id} />
                      <InviteButton label={t("screens.discover.invite")} />
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={sheetOpen} onClose={() => setSheetOpen(false)} title={t("screens.discover.filter")}>
        <FilterGroup label={t("screens.discover.niche")}>
          {NICHES.map((n) => (
            <button key={n} type="button" aria-pressed={nicheFilters.includes(n)} onClick={() => toggleIn("niche", nicheFilters, n)} className={chip(nicheFilters.includes(n))}>
              {nicheLabel(t, n)}
            </button>
          ))}
        </FilterGroup>
        <FilterGroup label={t("screens.discover.platform")}>
          {PLATFORMS.map((p) => (
            <button key={p} type="button" aria-pressed={platformFilters.includes(p)} onClick={() => toggleIn("platform", platformFilters, p)} className={chip(platformFilters.includes(p))}>
              {p}
            </button>
          ))}
        </FilterGroup>
        <FilterGroup label={t("screens.discover.followers")}>
          <div role="group" className="flex w-full gap-1 rounded bg-fog p-1">
            {[...new Set([...FOLLOWER_STEPS, minCount])].sort((a, b) => a - b).map((step) => (
              <button
                key={step}
                type="button"
                aria-pressed={minCount === step}
                onClick={() => setParam("minFollowers", step > 0 ? String(step) : "")}
                className={`min-h-10 flex-1 rounded text-sm font-medium transition ${
                  minCount === step ? "bg-background text-ink shadow-sm" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {step === 0 ? t("screens.discover.followersAny") : formatFollowers(step)}
              </button>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label={t("screens.discover.language")}>
          {LANGUAGES.map((l) => (
            <button key={l} type="button" aria-pressed={languages.includes(l)} onClick={() => toggleIn("language", languages, l)} className={chip(languages.includes(l))}>
              {contentLanguageLabel(t, l)}
            </button>
          ))}
        </FilterGroup>
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-footnote font-medium text-neutral-600 dark:text-neutral-400">{t("screens.discover.sortBy")}</legend>
          {Object.entries(SORTS).map(([key, label]) => (
            <label key={key} className="flex min-h-11 items-center justify-between gap-3 border-b border-ink/10 text-sm last:border-b-0">
              {t(label)}
              <input type="radio" name="discover-sort" checked={sort === key} onChange={() => setParam("sort", key)} className="h-5 w-5 accent-[var(--ink)]" />
            </label>
          ))}
        </fieldset>
        {/* Sticks to the sheet's bottom edge on phones, over the sheet's own bottom padding (the home indicator's room), so
            nothing scrolls by underneath it. */}
        <div className="sticky -mx-5 -mb-[max(var(--safe-bottom),20px)] bottom-[calc(-1*max(var(--safe-bottom),20px))] flex items-center gap-3 border-t border-ink/10 bg-background px-5 pt-3 pb-[calc(0.75rem+max(var(--safe-bottom),20px))] md:static md:m-0 md:border-0 md:p-0">
          <button type="button" onClick={resetFilters} className="min-h-11 shrink-0 px-1 text-sm font-medium underline">
            {t("screens.discover.resetFilters")}
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="min-h-11 flex-1 rounded-full bg-ink px-4 text-sm font-medium text-paper transition hover:bg-graphite"
          >
            {filtered.length === 1
              ? t("screens.discover.showResultsOne", { count: filtered.length })
              : t("screens.discover.showResultsMany", { count: filtered.length })}
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-footnote font-medium text-neutral-600 dark:text-neutral-400">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

// Starts the conversation about the picked request and opens it (see startConversationAsStartupAction).
function InviteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-10 w-full items-center justify-center rounded-full bg-ink px-3 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
    >
      {label}
    </button>
  );
}
