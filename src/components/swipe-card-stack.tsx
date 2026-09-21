"use client";

import { useState } from "react";
import { FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { SwipeCard, type SwipeRequest } from "@/components/swipe-card";
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
  const top = visible[0];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-[580px] w-full max-w-md">
        {visible.map((r, i) => (
          <SwipeCard key={r.id} request={r} stackIndex={i} onSwipe={(dir) => handleSwipe(r.id, dir)} />
        ))}
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-2">
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
            {stack.length} request{stack.length === 1 ? "" : "s"} left
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
  );
}
