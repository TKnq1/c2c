"use client";

import { useEffect, useRef, useState } from "react";
import { FiHeart, FiX } from "react-icons/fi";
import { SwipeCard, type SwipeCardHandle, type SwipeRequest } from "@/components/swipe-card";
import { PRIMARY_BUTTON, SkipButton, StepHeading } from "@/components/onboarding-ui";

// Made up and labelled as such on screen: swiping it sends nothing.
const EXAMPLE: SwipeRequest = {
  id: "onboarding-example",
  startupId: "onboarding-example",
  isBrandFavorited: false,
  title: "Summer glow routine",
  description: "Show your morning skincare routine in a Reel and tag us. We send the full set.",
  niche: "Beauty",
  languages: ["English"],
  minFollowers: 0,
  productCategory: "Cosmetics",
  companyName: "Example Brand",
  companyAvatarUrl: null,
  rating: { average: 0, count: 0 },
  photos: [],
  budgetMinCents: 30000,
  budgetMaxCents: 30000,
  platform: "Instagram",
  deliverables: "1 Reel + 2 Stories",
  postBy: null,
  productIncluded: true,
};

const OUTCOME = {
  right: { title: "That's an \u201CI'm interested\u201D", description: "The brand gets a notification and you can chat. Nothing is sent from this example." },
  left: { title: "That's a pass", description: "The request goes away and won't come back. You can undo your last pass in your feed." },
} as const;

// Teaches the one gesture the Feed is built on, on a made-up card, before
// the real feed shows up.
export function OnboardingSwipeDemo({ active, onNext, onSkip }: { active: boolean; onNext: () => void; onSkip: () => void }) {
  const [outcome, setOutcome] = useState<"left" | "right" | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  function nudge() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    deckRef.current?.animate(
      [
        { transform: "none" },
        { transform: "translateX(26px) rotate(2deg)" },
        { transform: "translateX(-8px) rotate(-0.7deg)" },
        { transform: "none" },
      ],
      { duration: 800, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
    );
  }

  // A small nudge once the step opens, so it is clear the card moves.
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(nudge, 700);
    return () => clearTimeout(timer);
  }, [active]);

  if (outcome) {
    const message = OUTCOME[outcome];
    return (
      <div className="animate-stagger-fade-in flex flex-col gap-6">
        <StepHeading title={message.title} description={message.description} />
        <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
          That&apos;s all there is to it: swipe right on what you like, left on what you don&apos;t. Anything you&apos;re
          interested in lands under Matches.
        </p>
        <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <StepHeading
        title="Swipe to decide"
        description="Right if you're interested, left to pass. Try it on this example."
      />

      <div className="relative">
        <div ref={deckRef} className="relative mx-auto h-[min(460px,56dvh)] w-full max-w-[340px]">
          <SwipeCard
            ref={cardRef}
            request={EXAMPLE}
            stackIndex={0}
            onSwipe={(direction) => setOutcome(direction)}
            onTap={nudge}
          />
        </div>
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
          Example
        </span>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => cardRef.current?.triggerExit("left")}
          aria-label="Pass"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/10 text-neutral-600 transition hover:border-ink hover:text-ink dark:text-neutral-400 dark:hover:text-white"
        >
          <FiX className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => cardRef.current?.triggerExit("right")}
          aria-label="Interested"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-graphite"
        >
          <FiHeart className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-col">
        <SkipButton onClick={onSkip}>Skip the tour</SkipButton>
      </div>
    </div>
  );
}
