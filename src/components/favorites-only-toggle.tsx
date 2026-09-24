"use client";

import { FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useUrlState } from "@/lib/use-url-state";

// Same star language as FavoriteButton, but toggles the page's "favorites
// only" filter instead of a single card's favorited state. Reads/writes the
// same "favorites" URL param DiscoverCreators/DiscoverBrands filter on —
// independent components, kept in sync purely through the shared URL.
export function FavoritesOnlyToggle() {
  const [{ favorites }, setParam] = useUrlState(["favorites"]);
  const active = favorites === "1";

  return (
    <button
      type="button"
      onClick={() => setParam("favorites", active ? "" : "1")}
      aria-pressed={active}
      aria-label={active ? "Show all" : "Show favorites only"}
      title={active ? "Show all" : "Show favorites only"}
      className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center self-center rounded-full border transition ${
        active ? "border-ink bg-ink text-paper" : "border-neutral-300 text-neutral-400 hover:text-ink hover:border-ink dark:border-neutral-700 dark:text-neutral-500"
      }`}
    >
      {active ? <FaStar className="h-4 w-4" /> : <FiStar className="h-4 w-4" />}
    </button>
  );
}
