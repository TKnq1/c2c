"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { SwipeCard, type SwipeCardHandle, type SwipeRequest } from "@/components/swipe-card";
import { EmptyState } from "@/components/empty-state";
import { RequestDetailsPanel } from "@/components/request-details-panel";
import { isTextField } from "@/lib/keyboard";
import { passRequestAction, swipeInterestedAction, undoPassAction } from "@/lib/actions/requests";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";
import { toast } from "@/lib/toast";
import { useI18n } from "@/components/i18n-provider";
import { errorMessage } from "@/lib/error-message";
import { createOrderedSaves } from "@/lib/ordered-saves";

const VISIBLE_DEPTH = 3;

export function SwipeCardStack({
  requests,
  caughtUp,
}: {
  requests: SwipeRequest[];
  // Replaces the "all caught up" text and the Discover link, for a feed
  // that has somewhere better to send you.
  caughtUp?: { description: string; action: { label: string; href: string } };
}) {
  const { t } = useI18n();
  const [stack, setStack] = useState(requests);
  // Only the single most recent pass is undoable — same as Tinder's own
  // rewind, and simpler to reason about than a full history. An
  // "interested" swipe already sent a real request, which is what Withdraw
  // interest in Your matches is for instead.
  const [lastPassed, setLastPassed] = useState<SwipeRequest | null>(null);
  // Saving a pass is fire-and-forget, so an undo right after could reach the
  // server before the pass does, and a second pass of the same card before
  // the undo — each card's saves go out one after the other, in the order
  // they happened.
  const [saveForRequest] = useState(createOrderedSaves);
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
        toast.success(t("screens.ui.savedBrand", { name: card.companyName }));
      } else {
        await unfavoriteStartupAction(card.startupId);
        toast.success(t("screens.ui.unsavedBrand", { name: card.companyName }));
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
    const card = stack.find((r) => r.id === id);
    setStack((prev) => prev.filter((r) => r.id !== id));
    if (direction === "left") {
      if (card) setLastPassed(card);
      // Failure just means the request shows up again on a later visit —
      // not worth interrupting the swiping over.
      saveForRequest(id, () => passRequestAction(id));
    } else {
      setLastPassed(null);
      try {
        const result = await swipeInterestedAction(id);
        if (result?.unavailable) {
          // Closed, blocked or out of reach since the page loaded: putting the
          // card back would only fail the same way again.
          toast.error(t("screens.ui.requestGone"));
          return;
        }
        toast.success(t("screens.ui.interestSent"));
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
    saveForRequest(id, () => undoPassAction(id));
  }

  const visible = stack.slice(0, VISIBLE_DEPTH);
  const topCard = visible[0];
  const topIsFavorited = topCard ? favoritedBrandIds.has(topCard.startupId) : false;

  // Desktop shortcuts, the same actions as the buttons: ← pass, → interested,
  // ↑ save the brand, R undo. Not while typing or while a sheet is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTextField(document.activeElement) || document.querySelector("dialog[open]")) return;
      if (e.key === "ArrowLeft") topCardRef.current?.triggerExit("left");
      else if (e.key === "ArrowRight") topCardRef.current?.triggerExit("right");
      else if (e.key === "ArrowUp" && topCard) toggleFavorite(topCard);
      else if (e.key === "r" || e.key === "R") undoLastPass();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (stack.length === 0) {
    return (
      <EmptyState
        icon={FiCheck}
        title={t("screens.requests.caughtUp")}
        description={caughtUp?.description ?? t("screens.feed.caughtUpDefault")}
        action={
          lastPassed
            ? { label: t("screens.feed.undo"), onClick: undoLastPass }
            : (caughtUp?.action ?? { label: t("screens.feed.browseDiscover"), href: "/dashboard/creator/discover" })
        }
      />
    );
  }

  return (
    // From lg up the card keeps phone proportions on the left and the top
    // card's details stay open on the right (RequestDetailsPanel); below
    // that it's the phone layout, details behind a tap.
    <div className="flex flex-col items-center gap-3 max-md:flex-1 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
      <div className="flex w-full flex-col items-center gap-3 max-md:flex-1 md:w-auto">
        {/* -mx-6 cancels the padded <main> this sits inside (see
            dashboard/layout.tsx) so the card itself runs edge-to-edge on
            phones instead of sitting in a centered, padded column. From md
            up it's a phone-sized card. On phones its height is whatever is
            left in <main> (flex-1 up the chain; see .feed-fill in
            globals.css), so the buttons below stay on screen on any phone
            and whatever sits above (install notice) is accounted for. */}
        <div className="relative -mx-6 w-[calc(100%+3rem)] max-md:max-h-[46rem] max-md:min-h-[22rem] max-md:flex-1 md:mx-0 md:h-[min(600px,70dvh)] md:w-[400px]">
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
            {stack.length === 1
              ? t("screens.ui.leftOne", { count: stack.length })
              : t("screens.ui.leftMany", { count: stack.length })}
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
              aria-label={t("screens.feed.pass")}
              className="flex h-14 w-14 shrink-0 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-600 transition hover:border-ink hover:text-ink dark:text-neutral-400 dark:hover:text-white"
            >
              <FiX className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => topCard && toggleFavorite(topCard)}
              disabled={!topCard}
              aria-label={topIsFavorited ? t("screens.feed.unsaveBrand") : t("screens.feed.saveBrand")}
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
              aria-label={t("screens.feed.interested")}
              className="flex h-14 w-14 shrink-0 items-center justify-center justify-self-center rounded-full bg-ink text-paper transition hover:bg-graphite"
            >
              <FiHeart className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={undoLastPass}
              disabled={!lastPassed}
              aria-label={t("screens.feed.undo")}
              className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-400 transition-colors hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-ink/10 disabled:hover:text-neutral-400 dark:hover:text-white"
            >
              <FiRotateCcw className="h-4 w-4" />
            </button>
          </div>
          <p className="hidden text-xs text-neutral-400 md:block dark:text-neutral-500">
            <kbd className="font-sans">←</kbd> {t("screens.feed.pass")} · <kbd className="font-sans">→</kbd> {t("screens.feed.interested")} ·{" "}
            <kbd className="font-sans">↑</kbd> {t("screens.feed.saveBrand")} · <kbd className="font-sans">R</kbd> {t("screens.feed.undo")}
          </p>
        </div>
      </div>

      {topCard && (
        <div className="hidden w-full max-w-md lg:block">
          <RequestDetailsPanel key={topCard.id} request={topCard} />
        </div>
      )}
    </div>
  );
}
