"use client";

import { useRef, useState } from "react";
import { FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { SwipeCard, type SwipeCardHandle, type SwipeRequest } from "@/components/swipe-card";
import { EmptyState } from "@/components/empty-state";
import { expressInterestAction, passRequestAction, undoPassAction } from "@/lib/actions/requests";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import { vibrate } from "@/lib/haptics";

const VISIBLE_DEPTH = 3;

export function SwipeCardStack({ requests }: { requests: SwipeRequest[] }) {
  const [stack, setStack] = useState(requests);
  // Only the single most recent pass is undoable — same as Tinder's own
  // rewind, and simpler to reason about than a full history. An
  // "interested" swipe already sent a real request, which is what Withdraw
  // interest in Your matches is for instead.
  const [lastPassed, setLastPassed] = useState<SwipeRequest | null>(null);
  // Saving a pass is fire-and-forget, so an undo right after could reach the
  // server first and then get overwritten by the pass landing late — undo
  // waits for that request's pending save before deleting it.
  const pendingPassesRef = useRef(new Map<string, Promise<void>>());
  // The star saves the brand behind the request (the same Favorite row as
  // Discover's star), so it's keyed by brand: every card from that brand
  // shows it starred at once.
  const [favoritedBrandIds, setFavoritedBrandIds] = useState(
    () => new Set(requests.filter((r) => r.isBrandFavorited).map((r) => r.startupId)),
  );
  function setBrandFavorited(startupId: string, favorited: boolean) {
    setFavoritedBrandIds((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(startupId);
      else next.delete(startupId);
      return next;
    });
  }
  async function toggleFavorite(card: SwipeRequest) {
    const favorited = !favoritedBrandIds.has(card.startupId);
    setBrandFavorited(card.startupId, favorited);
    try {
      if (favorited) {
        await favoriteStartupAction(card.startupId);
        toast.success(`${card.companyName} saved — find it under Favorites on Discover.`);
      } else {
        await unfavoriteStartupAction(card.startupId);
        toast.success(`Removed ${card.companyName} from favorites.`);
      }
    } catch (err) {
      setBrandFavorited(card.startupId, !favorited);
      toast.error(errorMessage(err));
    }
  }
  // Pass/Interested used to call handleSwipe directly, skipping the fly-out
  // animation entirely (the card would just vanish) since that animation
  // lives inside SwipeCard's own pointer handling, which a button click
  // never touches. This ref lets the buttons trigger the same exit a
  // completed drag does — handleSwipe still only ever runs from
  // SwipeCard's onSwipe, once the animation actually finishes.
  const topCardRef = useRef<SwipeCardHandle>(null);
  // A card put back (undo, or a failed "interested") is a fresh mount —
  // fully removed from stack in between, not the same instance
  // re-appearing — so it needs to be told which side it's flying back in
  // from; see restoredFrom on SwipeCard. Stays set after that; it's only
  // ever read at that one card's mount moment.
  const [restored, setRestored] = useState<{ id: string; from: "left" | "right" } | null>(null);

  async function handleSwipe(id: string, direction: "left" | "right") {
    vibrate();
    const card = stack.find((r) => r.id === id);
    setStack((prev) => prev.filter((r) => r.id !== id));
    if (direction === "left") {
      if (card) setLastPassed(card);
      // Failure just means the request shows up again on a later visit —
      // not worth interrupting the swiping over.
      pendingPassesRef.current.set(id, passRequestAction(id).catch(() => {}));
    } else {
      setLastPassed(null);
      try {
        await expressInterestAction(id);
        toast.success("Interest sent.");
      } catch (err) {
        // Nothing was sent, so the card comes back rather than silently
        // vanishing — flying in from the right, where it just went.
        if (card) {
          setRestored({ id: card.id, from: "right" });
          setStack((prev) => [card, ...prev]);
        }
        toast.error(errorMessage(err));
      }
    }
  }

  function undoLastPass() {
    if (!lastPassed) return;
    const { id } = lastPassed;
    setRestored({ id, from: "left" });
    setStack((prev) => [lastPassed, ...prev]);
    setLastPassed(null);
    const pending = pendingPassesRef.current.get(id) ?? Promise.resolve();
    pendingPassesRef.current.delete(id);
    pending.then(() => undoPassAction(id)).catch(() => {});
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
  const topIsFavorited = topCard ? favoritedBrandIds.has(topCard.startupId) : false;

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
            restoredFrom={r.id === restored?.id ? restored.from : undefined}
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
            onClick={() => topCard && toggleFavorite(topCard)}
            disabled={!topCard}
            aria-label={topIsFavorited ? "Remove brand from favorites" : "Save brand to favorites"}
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
