"use client";

import { useRef, useState } from "react";
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
  // Not component state on purpose — this only guards against a double-fire
  // mid-request, it isn't something the button should ever visibly show
  // (disabling/dimming it while pending made an already-instant-looking
  // toggle read as stuck or slow, since the round-trip it's waiting on can
  // still take a second or more).
  const pendingRef = useRef(false);

  // Also used inside a <Link> (CreatorCard/BrandCard) — stop the click from
  // bubbling into the card's own navigation.
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pendingRef.current) return;
    // Flip the star immediately rather than waiting on the round-trip — a
    // toggle has no meaningful failure mode a user needs to see mid-click,
    // so optimistic-then-revert reads as instant instead of laggy.
    const next = !favorited;
    setFavorited(next);
    onToggle?.(id, next);
    pendingRef.current = true;
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
      pendingRef.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      title={favorited ? "Remove from favorites" : "Save to favorites"}
      className={`rounded-full border p-3 -m-1 transition shrink-0 ${
        favorited ? "border-ink bg-ink text-paper" : "border-neutral-300 text-neutral-400 hover:text-ink hover:border-ink dark:border-neutral-700 dark:text-neutral-500"
      }`}
    >
      {favorited ? <FaStar className="h-4 w-4" /> : <FiStar className="h-4 w-4" />}
    </button>
  );
}
