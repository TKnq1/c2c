"use client";

import { Children, useEffect, useRef, useState } from "react";
import { IoSparkles } from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";
import type { OnboardingState } from "@/lib/actions/onboarding";
import { localizedInsight } from "@/lib/i18n/insight";
import type { OnboardingInsight } from "@/lib/onboarding-flow";
import { prepareSounds, unlockSounds } from "@/lib/sounds";

// Shared pieces of the brand and creator onboarding wizards.

export const PRIMARY_BUTTON =
  "flex-1 rounded-full bg-ink px-4 py-3.5 font-medium text-paper transition hover:bg-graphite disabled:opacity-40 disabled:hover:bg-ink";
const SECONDARY_BUTTON =
  "rounded-full border border-neutral-300 bg-paper px-5 py-3.5 font-medium text-neutral-600 transition hover:border-ink dark:border-neutral-700 dark:text-neutral-400";

// One step is a column: the question, the answer, then the action. On a
// phone the column fills the screen so the action can sit on the bottom
// edge. On a wider screen the column shrinks to its content and the page
// centers it.
export const stepScreen = "flex flex-1 flex-col gap-5 sm:my-auto sm:flex-none";
export const stepActions = "mt-auto flex flex-col gap-3 pt-2 sm:mt-0";

export const FIELD_CLASS =
  "w-full rounded border border-neutral-300 bg-background px-4 py-4 text-lg font-medium outline-none transition placeholder:font-normal placeholder:text-neutral-400 focus:border-ink dark:border-neutral-700";

export function OnboardingProgress({ step, total, labels }: { step: number; total: number; labels?: string[] }) {
  const { t } = useI18n();
  const current = Math.min(step + 1, total);
  const label = labels?.[step];
  return (
    <div>
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-fog">
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out"
              style={{ width: i <= step ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
      <p className="mt-2.5 flex items-baseline justify-between gap-3 text-xs">
        {label ? <span className="font-medium text-ink">{label}</span> : <span />}
        <span className="shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">{t("onboarding.progress", { current, total })}</span>
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

  // The success sound is ready by the time a step wants it.
  useEffect(() => {
    prepareSounds();
  }, []);

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
    <div ref={ref} className="flex flex-1 flex-col">
      {Children.toArray(children).map((child, i) => (
        <div key={i} className={i === step ? "flex flex-1 flex-col animate-stagger-fade-in" : "hidden"}>
          {child}
        </div>
      ))}
    </div>
  );
}

export function StepHeading({ title, description, align = "left" }: { title: string; description: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : undefined}>
      <h1 className="font-display text-title-1 font-bold text-balance">{title}</h1>
      <p className="mt-2 text-pretty text-neutral-600 dark:text-neutral-400">{description}</p>
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

export function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" onClick={onClick} className={SECONDARY_BUTTON}>
      {t("common.back")}
    </button>
  );
}

export function StepFooter({
  onBack,
  pending,
  disabled,
  label,
}: {
  onBack?: () => void;
  pending: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="flex gap-2">
      {onBack && <BackButton onClick={onBack} />}
      <button type="submit" disabled={pending || disabled} onClick={unlockSounds} className={PRIMARY_BUTTON}>
        {pending ? t("common.saving") : (label ?? t("common.continue"))}
      </button>
    </div>
  );
}

// Moves the wizard on once a step's action reports success. Each submit
// returns a fresh state object, so re-submitting a step after going back
// moves on again; the same result is only ever acted on once, since the
// steps stay mounted and re-render while later ones are on screen.
export function useStepDone(state: OnboardingState, onDone: (state: NonNullable<OnboardingState>) => void) {
  const handled = useRef<OnboardingState>(undefined);
  useEffect(() => {
    if (!state?.success || handled.current === state) return;
    handled.current = state;
    onDone(state);
  }, [state, onDone]);
}

// A number that counts up to `target` once, so a figure from the database
// lands as a moment instead of just appearing. Straight to the end for
// anyone who prefers reduced motion.
export function useCountUp(target: number | null, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null) return;
    if (target === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / durationMs, 1);
      // Ease-out: quick at first, settling on the real number.
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return target === null ? 0 : value;
}

// What the step just before found out, e.g. "4 open requests in Beauty from
// 2 brands." Shown at the top of the next step.
export function InsightBanner({ insight }: { insight: OnboardingInsight | undefined }) {
  const { t } = useI18n();
  const message = insight ? localizedInsight(insight, t) : null;
  const shown = useCountUp(message?.count ?? null);
  if (!message) return null;
  return (
    <p
      role="status"
      className="animate-stagger-fade-in mb-4 flex items-start gap-3 rounded bg-fog px-4 py-3.5 text-sm text-neutral-700 dark:text-neutral-300"
    >
      <IoSparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      <span>
        {message.count !== null && <strong className="mr-1 text-base font-black text-ink tabular-nums">{shown}</strong>}
        {message.text}
      </span>
    </p>
  );
}

export function SkipButton({ onClick, children }: { onClick: () => void; children?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => {
        unlockSounds();
        onClick();
      }}
      className="self-center px-3 py-2 text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
    >
      {children ?? t("common.skip")}
    </button>
  );
}
