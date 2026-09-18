"use client";

import { useState } from "react";
import { FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { toast } from "@/lib/toast";

export function FavoriteButton({
  id,
  initialFavorited,
  favoriteAction,
  unfavoriteAction,
  onToggle,
}: {
  id: string;
  initialFavorited: boolean;
  favoriteAction: (id: string) => Promise<void>;
  unfavoriteAction: (id: string) => Promise<void>;
  // Fires synchronously with the optimistic flip below, not after the
  // server round-trip — lets a parent list (e.g. a "favorites only" filter)
  // stay in sync with what the star already shows, instead of only updating
  // once revalidatePath's background refetch eventually lands.
  onToggle?: (id: string, favorited: boolean) => void;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  // Also used inside a <Link> (CreatorCard/BrandCard) — stop the click from
  // bubbling into the card's own navigation.
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    // Flip the star immediately rather than waiting on the round-trip — a
    // toggle has no meaningful failure mode a user needs to see mid-click,
    // so optimistic-then-revert reads as instant instead of laggy.
    const next = !favorited;
    setFavorited(next);
    onToggle?.(id, next);
    setPending(true);
    try {
      if (next) {
        await favoriteAction(id);
        toast.success("Saved to favorites.");
      } else {
        await unfavoriteAction(id);
        toast.success("Removed from favorites.");
      }
    } catch (err) {
      setFavorited(!next);
      onToggle?.(id, !next);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      title={favorited ? "Remove from favorites" : "Save to favorites"}
      className={`rounded border p-2 transition disabled:opacity-50 shrink-0 ${
        favorited ? "border-ink bg-ink text-paper" : "border-neutral-300 text-neutral-400 hover:text-ink hover:border-ink dark:border-neutral-700 dark:text-neutral-500"
      }`}
    >
      {favorited ? <FaStar className="h-4 w-4" /> : <FiStar className="h-4 w-4" />}
    </button>
  );
}
