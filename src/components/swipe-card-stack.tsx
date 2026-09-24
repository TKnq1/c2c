"use client";

import { useRef, useState } from "react";
import { FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { SwipeCard, type SwipeCardHandle, type SwipeRequest } from "@/components/swipe-card";
import { EmptyState } from "@/components/empty-state";
import { expressInterestAction } from "@/lib/actions/requests";
import { toast } from "@/lib/toast";
import { vibrate } from "@/lib/haptics";

const VISIBLE_DEPTH = 3;

export function SwipeCardStack({ requests }: { requests: SwipeRequest[] }) {
  const [stack, setStack] = useState(requests);
  // Only the single most recent pass is undoable — same as Tinder's own
  // rewind, and simpler to reason about than a full history (a passed
  // card never touched the server, so bringing it back is always safe;
  // an "interested" swipe already sent a real request, which is what
  // Withdraw interest in Your matches is for instead).
  const [lastPassed, setLastPassed] = useState<SwipeRequest | null>(null);
  // Local only, same as the rest of this stack's interaction polish — no
  // server field for this yet, just a per-session bookmark.
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  function toggleFavorite(id: string) {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  // Pass/Interested used to call handleSwipe directly, skipping the fly-out
  // animation entirely (the card would just vanish) since that animation
  // lives inside SwipeCard's own pointer handling, which a button click
  // never touches. This ref lets the buttons trigger the same exit a
  // completed drag does — handleSwipe still only ever runs from
  // SwipeCard's onSwipe, once the animation actually finishes.
  const topCardRef = useRef<SwipeCardHandle>(null);
  // The undone card is a fresh mount (fully removed from stack while
  // passed, not the same instance re-appearing), so it needs to be told
  // it just arrived via undo — see restoredFromPass on SwipeCard. Stays
  // set after that; it's only ever read at that one card's mount moment.
  const [justRestoredId, setJustRestoredId] = useState<string | null>(null);

  async function handleSwipe(id: string, direction: "left" | "right") {
    vibrate();
    const card = stack.find((r) => r.id === id);
    setStack((prev) => prev.filter((r) => r.id !== id));
    if (direction === "left") {
      if (card) setLastPassed(card);
    } else {
      setLastPassed(null);
      try {
        await expressInterestAction(id);
        toast.success("Interest sent.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
  }

  function undoLastPass() {
    if (!lastPassed) return;
    setJustRestoredId(lastPassed.id);
    setStack((prev) => [lastPassed, ...prev]);
    setLastPassed(null);
  }

  if (stack.length === 0) {
    return (
      <EmptyState
        icon={FiCheck}
        title="You're all caught up."
        description="No more new requests to review right now — check back later."
        action={
          lastPassed
            ? { label: "Undo last pass", onClick: undoLastPass }
            : { label: "Browse Discover", href: "/dashboard/creator/discover" }
        }
      />
    );
  }

  const visible = stack.slice(0, VISIBLE_DEPTH);
  const topCard = visible[0];
  const topIsFavorited = topCard ? favoritedIds.has(topCard.id) : false;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* -mx-6 cancels the padded <main> this sits inside (see
          dashboard/layout.tsx) so the card itself runs edge-to-edge
          instead of sitting in a centered, padded column. */}
      <div className="relative -mx-6 h-[min(580px,62dvh)] w-[calc(100%+3rem)]">
        {visible.map((r, i) => (
          <SwipeCard
            key={r.id}
            ref={i === 0 ? topCardRef : undefined}
            request={r}
            stackIndex={i}
            onSwipe={(dir) => handleSwipe(r.id, dir)}
            restoredFromPass={r.id === justRestoredId}
          />
        ))}
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-2">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {stack.length} request{stack.length === 1 ? "" : "s"} left
        </p>
        {/* Pass / Favorite / Interested / Undo, big-small-big-small — same
            weighting as Tinder's own row for the swipe actions, with undo
            as a lighter secondary one off to the side rather than
            competing with Pass for the leftmost spot. Undo and favorite
            are always mounted (not popped in/out) and just dim out via
            :disabled when there's nothing to act on, rather than
            appearing/disappearing — a steady 4-button row instead of one
            that resizes itself mid-session.

            Five equal grid columns, not a flex row — undo sitting alone on
            the right (instead of mirrored by another button on the left)
            would otherwise pull the whole group's visual center off to the
            left of the page. The empty first column weighs exactly as much
            as undo's column, so favorite — the middle column — lands on
            the page's actual center rather than just the midpoint between
            Pass and Interested. */}
        <div className="grid w-full grid-cols-5 items-center">
          <div aria-hidden="true" />
          <button
            type="button"
            onClick={() => topCardRef.current?.triggerExit("left")}
            aria-label="Pass"
            className="flex h-14 w-14 shrink-0 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-600 transition hover:border-ink hover:text-ink dark:text-neutral-400 dark:hover:text-white"
          >
            <FiX className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => topCard && toggleFavorite(topCard.id)}
            disabled={!topCard}
            aria-label={topIsFavorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={topIsFavorited}
            className={`flex h-10 w-10 shrink-0 items-center justify-center justify-self-center rounded-full border transition-colors disabled:opacity-40 ${
              topIsFavorited
                ? "border-amber-400 bg-amber-400 text-white"
                : "border-ink/10 text-neutral-400 hover:border-ink hover:text-ink dark:hover:text-white"
            }`}
          >
            {topIsFavorited ? <IoStar className="h-4 w-4" /> : <IoStarOutline className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => topCardRef.current?.triggerExit("right")}
            aria-label="Interested"
            className="flex h-14 w-14 shrink-0 items-center justify-center justify-self-center rounded-full bg-ink text-paper transition hover:bg-graphite"
          >
            <FiHeart className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={undoLastPass}
            disabled={!lastPassed}
            aria-label="Undo last pass"
            className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-400 transition-colors hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-ink/10 disabled:hover:text-neutral-400 dark:hover:text-white"
          >
            <FiRotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
