"use client";

import { IoCashOutline, IoLockClosedOutline, IoTimeOutline } from "react-icons/io5";
import { ConnectStripeButton } from "@/components/connect-stripe-button";
import { useI18n } from "@/components/i18n-provider";
import { SkipButton, StepHeading } from "@/components/onboarding-ui";

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
export function OnboardingPayoutStep({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("onboarding.payout.title")} description={t("onboarding.payout.description")} />
      <ul className="flex flex-col gap-3">
        {POINTS.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
            {t(key)}
          </li>
        ))}
      </ul>
      <ConnectStripeButton
        isOnboarded={false}
        label={t("onboarding.payout.setup")}
        buttonClassName="w-full rounded-full bg-ink px-4 py-3 font-medium text-paper transition hover:bg-graphite disabled:opacity-40"
        embedClassName="rounded border border-ink/10 bg-paper p-4"
        onExit={onDone}
      />
      <SkipButton onClick={onSkip}>{t("onboarding.payout.later")}</SkipButton>
    </div>
  );
}
