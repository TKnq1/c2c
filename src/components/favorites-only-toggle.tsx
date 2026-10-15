"use client";

import { FiStar } from "react-icons/fi";
import { IoStar } from "react-icons/io5";
import { useUrlState } from "@/lib/use-url-state";
import { useI18n } from "@/components/i18n-provider";

// Same star language as FavoriteButton, but toggles the page's "favorites
// only" filter instead of a single card's favorited state. On Discover it sits
// in the phone header (see Nav) and beside the page title from md up. Reads/writes the
// same "favorites" URL param DiscoverCreators/DiscoverBrands filter on —
// independent components, kept in sync purely through the shared URL.
export function FavoritesOnlyToggle({ variant = "round", className = "" }: { variant?: "round" | "header"; className?: string }) {
  const { t } = useI18n();
  const [{ favorites }, setParam] = useUrlState(["favorites"]);
  const active = favorites === "1";
  const label = active ? t("screens.discover.showAll") : t("screens.discover.favoritesOnly");

  // In the phone header: a bare icon among the header's others (bell, matches), filled while only saved ones show.
  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={() => setParam("favorites", active ? "" : "1")}
        aria-pressed={active}
        aria-label={label}
        className={`-m-2.5 flex items-center p-2.5 transition hover:text-ink ${active ? "text-ink" : "text-graphite"} ${className}`}
      >
        {active ? <IoStar className="h-5 w-5" /> : <FiStar className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setParam("favorites", active ? "" : "1")}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border transition ${
        active ? "border-ink bg-ink text-paper" : "border-neutral-300 text-neutral-500 hover:text-ink hover:border-ink dark:border-neutral-700 dark:text-neutral-400"
      } ${className}`}
    >
      {active ? <IoStar className="h-4 w-4" /> : <FiStar className="h-4 w-4" />}
    </button>
  );
}
