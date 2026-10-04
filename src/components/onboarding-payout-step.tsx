"use client";

import { IoCashOutline, IoLockClosedOutline, IoTimeOutline } from "react-icons/io5";
import { ConnectStripeButton } from "@/components/connect-stripe-button";
import { SkipButton, StepHeading } from "@/components/onboarding-ui";

// Whether the step can work at all: without Stripe's publishable key the
// embedded form can't load, so the wizard leaves the step out.
export const PAYOUTS_AVAILABLE = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const POINTS = [
  { icon: IoLockClosedOutline, text: "A brand pays into escrow before you create anything." },
  { icon: IoCashOutline, text: "The money is released to you once the post is live." },
  { icon: IoTimeOutline, text: "Setting it up now takes about two minutes, and means the first brand that picks you can pay straight away." },
];

// Right after the matches: while the pull of "these are waiting for me" is at
// its strongest, ask for the one thing that stops a brand from paying.
// Skippable; Settings and the Payments page have the same button.
export function OnboardingPayoutStep({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="Get ready to be paid" description="Connect your payout details so a brand can pay you the moment you agree." />
      <ul className="flex flex-col gap-3">
        {POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      <ConnectStripeButton isOnboarded={false} label="Set up payouts" embedClassName="rounded border border-ink/10 bg-paper p-4" onExit={onDone} />
      <SkipButton onClick={onSkip}>I&apos;ll do this later</SkipButton>
    </div>
  );
}
