"use client";

import { useRef, useState } from "react";
import { FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { SwipeCard, type SwipeCardHandle } from "@/components/swipe-card";
import { AppHeader, AppTabBar, PhoneFrame } from "@/components/landing/phone-frame";
import { deck, type PhotoKey } from "@/components/landing/landing-data";

type Card = ReturnType<typeof deck>[number];

// The Feed, for real: the app's own swipe cards with made-up brands. Drag,
// flick or tap the buttons; nothing is sent anywhere. The deck deals itself
// again when it runs out, and the photo on top colours the hero (onTop).
export function CreatorDeck({ onTop }: { onTop: (photo: PhotoKey) => void }) {
  const [stack, setStack] = useState<Card[]>(() => deck(0));
  const [round, setRound] = useState(0);
  const [lastPassed, setLastPassed] = useState<Card | null>(null);
  const [restored, setRestored] = useState<string | null>(null);
  const [starred, setStarred] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<{ id: string; brand: string } | null>(null);
  const [touched, setTouched] = useState(false);
  const topRef = useRef<SwipeCardHandle>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  // A tap opens nothing here (the details are for the app); the stack
  // gives a little wiggle instead, so it's clear it wants dragging.
  function wiggle() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    deckRef.current?.animate(
      [
        { transform: "none" },
        { transform: "translateX(22px) rotate(2deg)" },
        { transform: "translateX(-7px) rotate(-0.7deg)" },
        { transform: "none" },
      ],
      { duration: 700, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
    );
  }

  function show(next: Card[]) {
    setStack(next);
    if (next[0]) onTop(next[0].photoKey);
  }

  function handleSwipe(card: Card, direction: "left" | "right") {
    let next = stack.filter((c) => c.id !== card.id);
    if (next.length === 0) {
      next = deck(round + 1);
      setRound(round + 1);
    }
    show(next);
    if (direction === "left") {
      setLastPassed(card);
    } else {
      setLastPassed(null);
      setToast({ id: card.id, brand: card.companyName });
    }
  }

  function undo() {
    if (!lastPassed) return;
    setRestored(lastPassed.id);
    show([lastPassed, ...stack]);
    setLastPassed(null);
  }

  const top = stack[0];
  const topStarred = top ? starred.has(top.startupId) : false;

  return (
    <div className="relative">
      <PhoneFrame className="h-[600px] w-[290px] max-w-full sm:h-[660px] sm:w-[320px]">
        <AppHeader title="Feed" />
        <div
          ref={deckRef}
          className={`relative mt-3 flex-1 ${touched ? "" : "lp-nudge"}`}
          onPointerDownCapture={() => setTouched(true)}
        >
          {stack.slice(0, 3).map((card, i) => (
            <SwipeCard
              key={card.id}
              ref={i === 0 ? topRef : undefined}
              request={card}
              stackIndex={i}
              onSwipe={(direction) => handleSwipe(card, direction)}
              restoredFrom={card.id === restored ? "left" : undefined}
              onTap={wiggle}
            />
          ))}
        </div>
        <div className="grid shrink-0 grid-cols-5 items-center py-3">
          <div aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              setTouched(true);
              topRef.current?.triggerExit("left");
            }}
            aria-label="Pass"
            className="flex h-12 w-12 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-600 transition hover:border-ink hover:text-ink dark:text-neutral-400 dark:hover:text-white"
          >
            <FiX className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              top &&
              setStarred((prev) => {
                const next = new Set(prev);
                if (next.has(top.startupId)) next.delete(top.startupId);
                else next.add(top.startupId);
                return next;
              })
            }
            aria-label={topStarred ? "Remove brand from favorites" : "Save brand to favorites"}
            aria-pressed={topStarred}
            className={`flex h-9 w-9 items-center justify-center justify-self-center rounded-full border transition-colors ${
              topStarred ? "border-amber-400 bg-amber-400 text-white" : "border-ink/10 text-neutral-400 hover:border-ink hover:text-ink dark:hover:text-white"
            }`}
          >
            {topStarred ? <IoStar className="h-4 w-4" /> : <IoStarOutline className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setTouched(true);
              topRef.current?.triggerExit("right");
            }}
            aria-label="Interested"
            className="flex h-12 w-12 items-center justify-center justify-self-center rounded-full bg-ink text-paper transition hover:bg-graphite"
          >
            <FiHeart className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={!lastPassed}
            aria-label="Undo last pass"
            className="flex h-9 w-9 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-400 transition-colors hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-ink/10 disabled:hover:text-neutral-400 dark:hover:text-white"
          >
            <FiRotateCcw className="h-4 w-4" />
          </button>
        </div>
        {/* The app's own toast, where the app shows it: just above the
            buttons. */}
        {toast && (
          <div
            key={toast.id}
            role="status"
            onAnimationEnd={() => setToast(null)}
            className="lp-toast absolute inset-x-3 bottom-[150px] z-40 flex items-center gap-2 rounded border border-ink/10 bg-paper px-3.5 py-3 text-sm shadow-lg"
          >
            <FiCheck className="h-4 w-4 shrink-0" />
            Interest sent to {toast.brand}.
          </div>
        )}
        <AppTabBar />
      </PhoneFrame>
    </div>
  );
}
