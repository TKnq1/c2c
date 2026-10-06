"use client";

import { useEffect } from "react";
import { IoCashOutline, IoInfiniteOutline } from "react-icons/io5";
import { Confetti } from "@/components/confetti";
import { useI18n } from "@/components/i18n-provider";
import { PRIMARY_BUTTON, stepActions, stepScreen, useCountUp } from "@/components/onboarding-ui";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";
import { FOUNDING_LIMIT, type FoundingSide } from "@/lib/founding-limits";
import { hapticSuccess } from "@/lib/haptics";
import { playSound } from "@/lib/sounds";

// The screen right after a brand's or a creator's account exists, when it got one of the founding places: the
// number counts up, the confetti falls, and what it means is said in two lines. The wizard keeps every step
// mounted, so the moment only starts once this step is the current one.
export function FoundingStep({
  side,
  active,
  number,
  onNext,
}: {
  side: FoundingSide;
  active: boolean;
  number: number;
  onNext: () => void;
}) {
  const { t } = useI18n();
  const shown = useCountUp(active ? number : null, 1100);
  const pro = PRO_PLATFORM_FEE_RATE * 100;
  const vars = { pro, standard: PLATFORM_FEE_RATE * 100, total: FOUNDING_LIMIT[side], keep: 100 - pro };
  const creator = side === "creator";

  useEffect(() => {
    if (!active) return;
    hapticSuccess();
    playSound("success");
  }, [active]);

  if (!active) return <div className={stepScreen} />;

  return (
    <div className={stepScreen}>
      <Confetti />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex flex-col items-center gap-1">
          <p className="font-display text-[3.75rem] leading-none font-black tabular-nums" aria-label={String(number)}>
            {shown}
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">{t(creator ? "founding.creator.ofTotal" : "founding.ofTotal", vars)}</p>
        </div>
        <div>
          <h1 className="font-display text-title-1 font-bold text-balance">{t("founding.title")}</h1>
          <p className="mt-2 text-pretty text-neutral-600 dark:text-neutral-400">{t(creator ? "founding.creator.body" : "founding.body", vars)}</p>
        </div>
        <ul className="w-full overflow-hidden rounded bg-fog text-left">
          {[
            { icon: IoCashOutline, text: t("founding.perkFee", vars) },
            { icon: IoInfiniteOutline, text: t("founding.perkPrice") },
          ].map((perk, i) => (
            <li
              key={perk.text}
              className="animate-stagger-fade-in flex items-center gap-3 border-ink/10 px-4 py-3.5 [&+&]:border-t"
              style={{ animationDelay: `${500 + i * 120}ms` }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
                <perk.icon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" aria-hidden />
              </span>
              <span className="text-sm font-medium">{perk.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={stepActions}>
        <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
          {t("common.continue")}
        </button>
      </div>
    </div>
  );
}
