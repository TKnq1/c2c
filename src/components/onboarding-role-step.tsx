"use client";

import { useI18n } from "@/components/i18n-provider";
import { StepHeading, stepScreen } from "@/components/onboarding-ui";
import type { SignupRole } from "@/lib/signup-role";

// Only when /onboarding is opened without a side. The landing toggle and
// ?role= skip this, so it isn't one of the numbered steps.
export function OnboardingRoleStep({ onChoose }: { onChoose: (role: SignupRole) => void }) {
  const { t } = useI18n();
  return (
    <div className={stepScreen}>
      <StepHeading title={t("onboarding.role.title")} description={t("onboarding.role.description")} />
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onChoose("CREATOR")}
          className="w-full rounded-full bg-ink px-4 py-3.5 font-medium text-paper transition hover:bg-graphite"
        >
          {t("screens.auth.imCreator")}
        </button>
        <button
          type="button"
          onClick={() => onChoose("STARTUP")}
          className="w-full rounded-full border border-neutral-300 px-4 py-3.5 font-medium transition hover:border-ink dark:border-neutral-700"
        >
          {t("screens.auth.imBrand")}
        </button>
      </div>
    </div>
  );
}
