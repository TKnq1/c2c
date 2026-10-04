"use client";

import { useEffect, useRef, useState } from "react";
import { FiHeart, FiX } from "react-icons/fi";
import { SwipeCard, type SwipeCardHandle, type SwipeRequest } from "@/components/swipe-card";
import { useI18n } from "@/components/i18n-provider";
import { PRIMARY_BUTTON, SkipButton, StepHeading, stepActions, stepScreen } from "@/components/onboarding-ui";

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

// Teaches the one gesture the Feed is built on, on a made-up card, before
// the real feed shows up.
export function OnboardingSwipeDemo({ active, onNext, onSkip }: { active: boolean; onNext: () => void; onSkip: () => void }) {
  const { t } = useI18n();
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
    const message =
      outcome === "right"
        ? {
            title: t("onboarding.swipe.rightTitle"),
            description: t("onboarding.swipe.rightBody"),
          }
        : {
            title: t("onboarding.swipe.leftTitle"),
            description: t("onboarding.swipe.leftBody"),
          };
    return (
      <div className={`animate-stagger-fade-in ${stepScreen}`}>
        <StepHeading title={message.title} description={message.description} />
        <p className="rounded bg-fog px-4 py-3.5 text-sm text-neutral-700 dark:text-neutral-300">{t("onboarding.swipe.recap")}</p>
        <div className={stepActions}>
          <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} w-full`}>
            {t("common.continue")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={stepScreen}>
      <StepHeading title={t("onboarding.swipe.title")} description={t("onboarding.swipe.description")} />

      <div className="relative mx-auto flex min-h-[280px] w-full max-w-[340px] flex-1 flex-col pt-3">
        {/* On the card, not behind it: the card paints at z-10, so a label
            tucked under its top edge only showed as a sliver. The deck
            takes the room left under the heading so the buttons stay put. */}
        <span className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
          {t("onboarding.swipe.example")}
        </span>
        <div ref={deckRef} className="relative min-h-[280px] w-full flex-1">
          <SwipeCard ref={cardRef} request={EXAMPLE} stackIndex={0} onSwipe={(direction) => setOutcome(direction)} onTap={nudge} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => cardRef.current?.triggerExit("left")}
          aria-label={t("onboarding.swipe.pass")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/15 bg-background text-neutral-600 transition hover:border-ink hover:text-ink dark:text-neutral-400 dark:hover:text-white"
        >
          <FiX className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => cardRef.current?.triggerExit("right")}
          aria-label={t("onboarding.swipe.interested")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-graphite"
        >
          <FiHeart className="h-6 w-6" />
        </button>
      </div>

      <SkipButton onClick={onSkip}>{t("onboarding.swipe.skipTour")}</SkipButton>
    </div>
  );
}
