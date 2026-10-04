"use client";

import { useEffect, useRef } from "react";
import { trackOnboardingEventAction } from "@/lib/actions/onboarding-flow";
import type { OnboardingEventKind, OnboardingStepKey } from "@/lib/onboarding-flow";

export function trackOnboarding(step: OnboardingStepKey, kind: OnboardingEventKind) {
  trackOnboardingEventAction({ step, kind }).catch(() => {});
}

// Counts a step as viewed the first time it is on screen. Going back to it
// doesn't count again (the server keeps one row per step and kind anyway).
export function useTrackStepViews(current: OnboardingStepKey | undefined) {
  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (!current || seen.current.has(current)) return;
    seen.current.add(current);
    trackOnboarding(current, "viewed");
  }, [current]);
}
