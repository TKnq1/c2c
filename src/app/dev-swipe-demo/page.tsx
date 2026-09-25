"use client";

import { useRef, useState } from "react";
import { FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { SwipeCard, type SwipeCardHandle, type SwipeRequest } from "@/components/swipe-card";
import { EmptyState } from "@/components/empty-state";
import { vibrate } from "@/lib/haptics";

// Throwaway preview route — the real Nav shell, fake creator + fake
// requests, no login and nothing persisted. Nav itself is rendered
// globally from the root layout now (see nav.tsx's wantsNav), not by this
// page — it shows up here because this path is explicitly allow-listed
// there ("Feed" in its title comes from the same place). Swiping only
// updates local state (no server action), so every other nav tab still
// points at the real, auth-gated route (expected to bounce to /login from
// here).

// Inline SVG data URIs — real requests store an uploaded photo the same
// way (see RequestImageUpload/processRequestImageUpload), but the CSP's
// img-src only allows 'self'/data:/blob:, not an external placeholder host.
function mockImage(bg: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="${bg}"/><text x="400" y="225" font-family="sans-serif" font-size="28" fill="#ffffff" text-anchor="middle" opacity="0.85">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const MOCK_REQUESTS: SwipeRequest[] = [
  {
    id: "1",
    startupId: "demo-brand-1",
    isBrandFavorited: false,
    title: "Skincare Launch Video",
    description:
      "Looking for an authentic first-impressions video featuring our new vitamin C serum. Natural lighting, no heavy editing — just your honest take. We'll ship the full-size product plus two backups so you can reshoot if the light's bad that day.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 10000,
    productCategory: "Cosmetics",
    companyName: "Glow Beauty Co.",
    companyAvatarUrl: null,
    rating: { average: 4.8, count: 23 },
    imageUrl: mockImage("#e8b4a8", "Vitamin C Serum"),
  },
  {
    id: "2",
    startupId: "demo-brand-2",
    isBrandFavorited: false,
    title: "Get Ready With Me Post",
    description:
      "GRWM using our new eyeshadow palette for a night-out look. Tag us and link the palette in your bio. Open to either a Reel or a multi-photo carousel, whatever fits your feed better.",
    niche: "Beauty",
    languages: ["English", "German"],
    minFollowers: 15000,
    productCategory: "Cosmetics",
    companyName: "Lumen Cosmetics",
    companyAvatarUrl: null,
    rating: { average: 4.2, count: 8 },
    imageUrl: mockImage("#c9a0dc", "Eyeshadow Palette"),
  },
  {
    id: "3",
    startupId: "demo-brand-3",
    isBrandFavorited: false,
    title: "Unboxing Collab",
    description:
      "Unbox our skincare gift set live or on Reels — we'll send the full set plus a bonus item for you to keep. No script, just your genuine first reaction.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 8000,
    productCategory: "Cosmetics",
    companyName: "Petal & Co.",
    companyAvatarUrl: null,
    rating: { average: 0, count: 0 },
    imageUrl: null,
  },
  {
    id: "4",
    startupId: "demo-brand-4",
    isBrandFavorited: false,
    title: "Before/After Story Series",
    description:
      "3-day story series showing your routine with our retinol serum. We provide the product, you provide the honesty — even a 'this broke me out' update is fine, we'd rather know.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 12000,
    productCategory: "Cosmetics",
    companyName: "Dermly",
    companyAvatarUrl: null,
    rating: { average: 3.6, count: 5 },
    imageUrl: null,
  },
  {
    id: "5",
    startupId: "demo-brand-5",
    isBrandFavorited: false,
    title: "Product Review Reel",
    description:
      "60-second review reel of our new SPF moisturizer — what you liked, what you'd change, all good. We only ask that you mention SPF number and skin type on camera.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 20000,
    productCategory: "Cosmetics",
    companyName: "Sunlit Skin",
    companyAvatarUrl: null,
    rating: { average: 5, count: 41 },
    imageUrl: mockImage("#f5c26b", "SPF Moisturizer"),
  },
];

export default function SwipeDemoPage() {
  const [stack, setStack] = useState(MOCK_REQUESTS);
  const [lastPassed, setLastPassed] = useState<SwipeRequest | null>(null);
  // Local only, same as the rest of this demo's interaction polish — no
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
  // it just arrived via undo — see restoredFrom on SwipeCard. Stays
  // set after that; it's only ever read at that one card's mount moment.
  const [justRestoredId, setJustRestoredId] = useState<string | null>(null);

  function handleSwipe(id: string, direction: "left" | "right") {
    vibrate();
    if (direction === "left") {
      setLastPassed(stack.find((r) => r.id === id) ?? null);
    } else {
      setLastPassed(null);
    }
    setStack((prev) => prev.filter((r) => r.id !== id));
  }

  function undoLastPass() {
    if (!lastPassed) return;
    setJustRestoredId(lastPassed.id);
    setStack((prev) => [lastPassed, ...prev]);
    setLastPassed(null);
  }

  const visible = stack.slice(0, 3);
  const topCard = visible[0];
  const topIsFavorited = topCard ? favoritedIds.has(topCard.id) : false;

  return (
    // flex-1 min-h-0, not h-dvh — Nav (rendered globally now, see nav.tsx)
    // already locks <body> to one viewport tall for this route via the
    // dashboard-shell class, so this just has to fill what's left under
    // its header instead of re-asserting a full-viewport height itself.
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* flex-1 + min-h-0 makes this fill exactly what's left under the top
          bar (the bottom tab bar is fixed, so its height is reserved via
          padding instead) — overflow-hidden means the page itself never
          scrolls; the card stack below sizes to whatever room remains. */}
      {/* No local "your matches" view or entry point here anymore — the
          real navbar heart (MatchesLink, see nav.tsx) is the one and only
          way to it, same as on the real Feed page. */}
      {/* No horizontal/top padding here anymore — the card itself is meant
          to run edge-to-edge and flush against the navbar above it, so
          padding is applied per-section below instead of once for the
          whole page. */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col max-w-5xl w-full mx-auto pb-24 md:pb-4">
        {stack.length === 0 ? (
          <div className="px-6 pt-4">
            <EmptyState
              icon={FiCheck}
              title="You're all caught up."
              description="That's every simulated card — reload the page to try again."
              action={lastPassed ? { label: "Undo last pass", onClick: undoLastPass } : undefined}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center gap-3">
            <div className="relative w-full flex-1 min-h-0">
              {visible.map((r, i) => (
                <SwipeCard
                  key={r.id}
                  ref={i === 0 ? topCardRef : undefined}
                  request={r}
                  stackIndex={i}
                  onSwipe={(dir) => handleSwipe(r.id, dir)}
                  restoredFrom={r.id === justRestoredId ? "left" : undefined}
                />
              ))}
            </div>

            <div className="shrink-0 w-full max-w-md px-6 flex flex-col items-center gap-2">
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {stack.length} card{stack.length === 1 ? "" : "s"} left
              </p>
              {/* Pass / Favorite / Interested / Undo, big-small-big-small —
                  same weighting as Tinder's own row for the swipe actions,
                  with undo as a lighter secondary one off to the side
                  rather than competing with Pass for the leftmost spot.
                  Undo and favorite are always mounted (not popped in/out)
                  and just dim out via :disabled when there's nothing to
                  act on, rather than appearing/disappearing — a steady
                  4-button row instead of one that resizes itself
                  mid-session.

                  Five equal grid columns, not a flex row — undo sitting
                  alone on the right (instead of mirrored by another button
                  on the left) would otherwise pull the whole group's
                  visual center off to the left of the page. The empty
                  first column weighs exactly as much as undo's column, so
                  favorite — the middle column — lands on the page's actual
                  center rather than just the midpoint between Pass and
                  Interested. */}
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
        )}
      </main>
    </div>
  );
}
