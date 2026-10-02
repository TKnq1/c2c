"use client";

import { Children, useEffect, useRef } from "react";
import type { OnboardingState } from "@/lib/actions/onboarding";

// Shared pieces of the brand and creator onboarding wizards.

export const PRIMARY_BUTTON =
  "flex-1 rounded-full bg-ink px-4 py-3 font-medium text-paper transition hover:bg-graphite disabled:opacity-40 disabled:hover:bg-ink";
const SECONDARY_BUTTON =
  "rounded-full border border-neutral-300 px-5 py-3 font-medium text-neutral-600 transition hover:border-ink dark:border-neutral-700 dark:text-neutral-400";

export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-fog">
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out"
              style={{ width: i <= step ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Step {Math.min(step + 1, total)} of {total}
      </p>
    </div>
  );
}

// Every step stays mounted and only the current one is shown, so going Back
// finds what was typed or picked still there. Showing a step restarts its
// fade-in, and its first text field gets the focus.
export function StepPanels({ step, children }: { step: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    // The first step's own autoFocus covers the initial render.
    if (first.current) {
      first.current = false;
      return;
    }
    const panel = ref.current?.children[step];
    panel?.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  }, [step]);

  return (
    <div ref={ref}>
      {Children.toArray(children).map((child, i) => (
        <div key={i} hidden={i !== step} className="animate-stagger-fade-in">
          {child}
        </div>
      ))}
    </div>
  );
}

export function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-display text-title-1 font-bold text-balance">{title}</h1>
      <p className="mt-1.5 text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}

export function StepError({ state }: { state: OnboardingState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="text-sm text-ink">
      {state.error}
    </p>
  );
}

export function StepFooter({
  onBack,
  pending,
  disabled,
  label = "Continue",
}: {
  onBack?: () => void;
  pending: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex gap-2 pt-2">
      {onBack && (
        <button type="button" onClick={onBack} className={SECONDARY_BUTTON}>
          Back
        </button>
      )}
      <button type="submit" disabled={pending || disabled} className={PRIMARY_BUTTON}>
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}

// Moves the wizard on once a step's action reports success. Each submit
// returns a fresh state object, so re-submitting a step after going back
// moves on again; the same result is only ever acted on once, since the
// steps stay mounted and re-render while later ones are on screen.
export function useStepDone(state: OnboardingState, onDone: () => void) {
  const handled = useRef<OnboardingState>(undefined);
  useEffect(() => {
    if (!state?.success || handled.current === state) return;
    handled.current = state;
    onDone();
  }, [state, onDone]);
}
