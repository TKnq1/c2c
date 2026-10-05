"use client";

import { IoCashOutline, IoLockClosedOutline, IoTimeOutline } from "react-icons/io5";
import { ConnectStripeButton } from "@/components/connect-stripe-button";
import { useI18n } from "@/components/i18n-provider";
import { BackButton, SkipButton, StepHeading, stepActions, stepScreen } from "@/components/onboarding-ui";

// Whether the step can work at all: without Stripe's publishable key the
// embedded form can't load, so the wizard leaves the step out.
export const PAYOUTS_AVAILABLE = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const POINTS = [
  { icon: IoLockClosedOutline, key: "onboarding.payout.point1" },
  { icon: IoCashOutline, key: "onboarding.payout.point2" },
  { icon: IoTimeOutline, key: "onboarding.payout.point3" },
] as const;

// Right after the matches: while the pull of "these are waiting for me" is at
// its strongest, ask for the one thing that stops a brand from paying.
// Skippable; Settings and the Payments page have the same button.
export function OnboardingPayoutStep({ onBack, onDone, onSkip }: { onBack: () => void; onDone: () => void; onSkip: () => void }) {
  const { t } = useI18n();
  return (
    <div className={stepScreen}>
      <StepHeading title={t("onboarding.payout.title")} description={t("onboarding.payout.description")} />
      <ul className="overflow-hidden rounded bg-fog">
        {POINTS.map(({ icon: Icon, key }) => (
          <li
            key={key}
            className="flex items-start gap-3 px-4 py-3.5 text-sm text-neutral-700 [&+&]:border-t [&+&]:border-ink/10 dark:text-neutral-300"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
              <Icon className="h-5 w-5 text-ink" aria-hidden />
            </span>
            <span className="pt-1.5">{t(key)}</span>
          </li>
        ))}
      </ul>
      <div className={stepActions}>
        <div className="flex gap-2">
          <BackButton onClick={onBack} />
          <div className="min-w-0 flex-1">
        <ConnectStripeButton
          isOnboarded={false}
          label={t("onboarding.payout.setup")}
          buttonClassName="w-full rounded-full bg-ink px-4 py-3.5 font-medium text-paper transition hover:bg-graphite disabled:opacity-40"
          embedClassName="rounded border border-ink/10 bg-paper p-4"
          onExit={onDone}
        />
          </div>
        </div>
        <SkipButton onClick={onSkip}>{t("onboarding.payout.later")}</SkipButton>
      </div>
    </div>
  );
}
