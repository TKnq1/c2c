"use client";

import { useState } from "react";
import { FiArrowLeft, FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { Nav } from "@/components/nav";
import { SwipeCard, type SwipeRequest } from "@/components/swipe-card";
import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { formatFollowers } from "@/lib/format";
import { vibrate } from "@/lib/haptics";

// Throwaway preview route — the real Nav shell, fake creator + fake
// requests, no login and nothing persisted. Swiping only updates local
// state (no server action), so every other nav tab still points at the
// real, auth-gated route (expected to bounce to /login from here).
const FAKE_CREATOR = { niche: "Beauty", platform: "Instagram", followerCount: 50000 };

const MOCK_REQUESTS: SwipeRequest[] = [
  {
    id: "1",
    title: "Skincare Launch Video",
    description:
      "Looking for an authentic first-impressions video featuring our new vitamin C serum. Natural lighting, no heavy editing — just your honest take. We'll ship the full-size product plus two backups so you can reshoot if the light's bad that day.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 10000,
    productCategory: "Cosmetics",
    companyName: "Glow Beauty Co.",
    companyAvatarUrl: null,
  },
  {
    id: "2",
    title: "Get Ready With Me Post",
    description:
      "GRWM using our new eyeshadow palette for a night-out look. Tag us and link the palette in your bio. Open to either a Reel or a multi-photo carousel, whatever fits your feed better.",
    niche: "Beauty",
    languages: ["English", "German"],
    minFollowers: 15000,
    productCategory: "Cosmetics",
    companyName: "Lumen Cosmetics",
    companyAvatarUrl: null,
  },
  {
    id: "3",
    title: "Unboxing Collab",
    description:
      "Unbox our skincare gift set live or on Reels — we'll send the full set plus a bonus item for you to keep. No script, just your genuine first reaction.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 8000,
    productCategory: "Cosmetics",
    companyName: "Petal & Co.",
    companyAvatarUrl: null,
  },
  {
    id: "4",
    title: "Before/After Story Series",
    description:
      "3-day story series showing your routine with our retinol serum. We provide the product, you provide the honesty — even a 'this broke me out' update is fine, we'd rather know.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 12000,
    productCategory: "Cosmetics",
    companyName: "Dermly",
    companyAvatarUrl: null,
  },
  {
    id: "5",
    title: "Product Review Reel",
    description:
      "60-second review reel of our new SPF moisturizer — what you liked, what you'd change, all good. We only ask that you mention SPF number and skin type on camera.",
    niche: "Beauty",
    languages: ["English"],
    minFollowers: 20000,
    productCategory: "Cosmetics",
    companyName: "Sunlit Skin",
    companyAvatarUrl: null,
  },
];

export default function SwipeDemoPage() {
  const [stack, setStack] = useState(MOCK_REQUESTS);
  const [matches, setMatches] = useState<SwipeRequest[]>([]);
  const [view, setView] = useState<"swipe" | "matches">("swipe");
  const [lastPassed, setLastPassed] = useState<SwipeRequest | null>(null);

  function handleSwipe(id: string, direction: "left" | "right") {
    vibrate();
    const card = stack.find((r) => r.id === id);
    if (direction === "right" && card) {
      setMatches((prev) => [card, ...prev]);
      setLastPassed(null);
    } else if (direction === "left" && card) {
      setLastPassed(card);
    }
    setStack((prev) => prev.filter((r) => r.id !== id));
  }

  function undoLastPass() {
    if (!lastPassed) return;
    setStack((prev) => [lastPassed, ...prev]);
    setLastPassed(null);
  }

  const visible = stack.slice(0, 3);
  const top = visible[0];

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Nav role="CREATOR" unreadCount={2} unreadMessages={1} pendingPayments={1} />

      {/* flex-1 + min-h-0 makes this fill exactly what's left under the top
          bar (the bottom tab bar is fixed, so its height is reserved via
          padding instead) — overflow-hidden means the page itself never
          scrolls; the card stack below sizes to whatever room remains. */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col max-w-5xl w-full mx-auto px-6 pt-4 pb-24 md:pb-4">
        {view === "swipe" ? (
          <>
            <div className="shrink-0 pb-3 flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-normal">Your Feed</h1>
                <p className="text-sm text-neutral-600 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 dark:text-neutral-400">
                  <span>Matching requests for {FAKE_CREATOR.niche} ·</span>
                  <span className="inline-flex items-center gap-1">
                    <PlatformIcon platform={FAKE_CREATOR.platform} className="h-3.5 w-3.5" />
                    {formatFollowers(FAKE_CREATOR.followerCount)}
                  </span>
                  <span className="rounded bg-fog px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Demo data
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView("matches")}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-sm font-medium transition hover:border-ink"
              >
                <FiHeart className="h-4 w-4" />
                {matches.length}
              </button>
            </div>

            {stack.length === 0 ? (
              <EmptyState
                icon={FiCheck}
                title="You're all caught up."
                description="That's every simulated card — reload the page to try again."
                action={lastPassed ? { label: "Undo last pass", onClick: undoLastPass } : undefined}
              />
            ) : (
              <div className="flex-1 min-h-0 flex flex-col items-center gap-3">
                <div className="relative w-full max-w-md flex-1 min-h-0">
                  {visible.map((r, i) => (
                    <SwipeCard key={r.id} request={r} stackIndex={i} onSwipe={(dir) => handleSwipe(r.id, dir)} />
                  ))}
                </div>

                <div className="shrink-0 w-full max-w-md flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    {lastPassed && (
                      <button
                        type="button"
                        onClick={undoLastPass}
                        aria-label="Undo last pass"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition hover:text-ink dark:hover:text-white"
                      >
                        <FiRotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {stack.length} card{stack.length === 1 ? "" : "s"} left
                    </p>
                  </div>
                  <div className="flex w-full gap-3">
                    <button
                      type="button"
                      onClick={() => handleSwipe(top.id, "left")}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-ink/10 text-sm font-medium text-neutral-600 transition hover:border-ink hover:text-ink dark:text-neutral-400 dark:hover:text-white"
                    >
                      <FiX className="h-5 w-5" />
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwipe(top.id, "right")}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper transition hover:bg-graphite"
                    >
                      <FiHeart className="h-5 w-5" />
                      Interested
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="shrink-0 pb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView("swipe")}
                aria-label="Back to swiping"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 transition hover:border-ink"
              >
                <FiArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="font-display text-2xl font-normal">Your matches</h1>
            </div>

            {matches.length === 0 ? (
              <EmptyState
                icon={FiHeart}
                title="No matches yet."
                description="Swipe right on a card to see it here."
                action={{ label: "Back to swiping", onClick: () => setView("swipe") }}
              />
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pb-2">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-ink/10 p-4 shrink-0"
                  >
                    <Avatar src={m.companyAvatarUrl} name={m.companyName} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{m.companyName}</p>
                      <p className="font-semibold truncate">{m.title}</p>
                    </div>
                    <span className="shrink-0 rounded bg-fog px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300">
                      {m.niche}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
