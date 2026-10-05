"use client";

import { useI18n } from "@/components/i18n-provider";
import type { SignupRole } from "@/lib/signup-role";

// Two full-height halves. A tap picks the side and continues.
export function OnboardingRoleStep({ onChoose }: { onChoose: (role: SignupRole) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => onChoose("CREATOR")}
        className="flex flex-1 flex-col justify-end rounded bg-ink px-5 py-6 text-left text-paper transition hover:bg-graphite"
      >
        <span className="font-display text-title-2 font-bold">{t("screens.auth.imCreator")}</span>
        <span className="mt-1 max-w-[24ch] text-sm text-paper/80">{t("onboarding.role.creatorLine")}</span>
      </button>
      <button
        type="button"
        onClick={() => onChoose("STARTUP")}
        className="flex flex-1 flex-col justify-end rounded border border-ink/10 bg-fog px-5 py-6 text-left transition hover:border-ink"
      >
        <span className="font-display text-title-2 font-bold">{t("screens.auth.imBrand")}</span>
        <span className="mt-1 max-w-[24ch] text-sm text-neutral-600 dark:text-neutral-400">{t("onboarding.role.brandLine")}</span>
      </button>
    </div>
  );
}
