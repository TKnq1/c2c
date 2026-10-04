"use client";

import { useActionState, useState } from "react";
import { saveDisplayNameAction, saveNichesAction, savePlatformsAction } from "@/lib/actions/onboarding";
import { NicheTilesMulti } from "@/components/niche-tiles";
import { MAX_CREATOR_NICHES } from "@/lib/constants";
import { PlatformChips, type PlatformDraft } from "@/components/platform-chips";
import { OnboardingPhotoStep } from "@/components/onboarding-photo-step";
import { OnboardingDone } from "@/components/onboarding-done";
import { OnboardingProfileCard } from "@/components/onboarding-profile-card";
import { CreatorAha } from "@/components/onboarding-aha";
import { OnboardingSwipeDemo } from "@/components/onboarding-swipe-demo";
import { OnboardingPayoutStep, PAYOUTS_AVAILABLE } from "@/components/onboarding-payout-step";
import { OnboardingPushStep, usePushOffer } from "@/components/onboarding-push-step";
import {
  InsightBanner,
  OnboardingProgress,
  StepError,
  StepFooter,
  StepHeading,
  StepPanels,
  useStepDone,
} from "@/components/onboarding-ui";
import { CREATOR_STEPS, type OnboardingEventKind, type OnboardingInsight, type OnboardingStepKey } from "@/lib/onboarding-flow";
import { trackOnboarding, useTrackStepViews } from "@/lib/use-onboarding-tracking";

// Name, niches, platforms and a photo (optional) build the profile; then the
// payoff: the matches waiting for it, how swiping works, payouts and
// notifications (each optional), and the "all set" screen. Payouts and
// notifications are left out when they can't work here (see below).
const SETUP_STEPS = CREATOR_STEPS.slice(0, 4);

type StepDef = { key: OnboardingStepKey; render: (index: number) => React.ReactNode };

export function CreatorOnboarding({ emailVerified }: { emailVerified: boolean }) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformDraft[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [insights, setInsights] = useState<{ niches?: OnboardingInsight; platforms?: OnboardingInsight }>({});
  const [payoutsStarted, setPayoutsStarted] = useState(false);
  const pushOffer = usePushOffer();

  const name = displayName.trim();
  const back = (i: number) => setStep(i - 1);

  // Every step reports how it ended, then the wizard moves on. Math.max so
  // a step finished again after going Back doesn't send it backwards.
  function finish(i: number, kind: OnboardingEventKind = "completed") {
    trackOnboarding(defs[i].key, kind);
    setStep((s) => Math.max(s, i + 1));
  }

  const defs: StepDef[] = [
    {
      key: "name",
      render: (i) => <NameStep value={displayName} onChange={setDisplayName} onDone={() => finish(i)} />,
    },
    {
      key: "niches",
      render: (i) => (
        <NichesStep
          value={niches}
          onChange={setNiches}
          onBack={() => back(i)}
          onDone={(insight) => {
            setInsights((prev) => ({ ...prev, niches: insight }));
            finish(i);
          }}
        />
      ),
    },
    {
      key: "platforms",
      render: (i) => (
        <PlatformsStep
          value={platforms}
          onChange={setPlatforms}
          insight={insights.niches}
          onBack={() => back(i)}
          onDone={(insight) => {
            setInsights((prev) => ({ ...prev, platforms: insight }));
            finish(i);
          }}
        />
      ),
    },
    {
      key: "photo",
      render: (i) => (
        <>
          <InsightBanner insight={insights.platforms} />
          <OnboardingPhotoStep
            kind="photo"
            onPreview={setAvatar}
            onBack={() => back(i)}
            onDone={() => finish(i)}
            onSkip={() => {
              setAvatar(null);
              finish(i, "skipped");
            }}
          />
        </>
      ),
    },
    {
      key: "matches",
      render: (i) => <CreatorAha active={step === i} name={name} onNext={() => finish(i)} />,
    },
    {
      key: "swipe",
      render: (i) => <OnboardingSwipeDemo active={step === i} onNext={() => finish(i)} onSkip={() => finish(i, "skipped")} />,
    },
    ...(PAYOUTS_AVAILABLE
      ? [
          {
            key: "payouts" as const,
            render: (i: number) => (
              <OnboardingPayoutStep
                onDone={() => {
                  setPayoutsStarted(true);
                  finish(i);
                }}
                onSkip={() => finish(i, "skipped")}
              />
            ),
          },
        ]
      : []),
    ...(pushOffer
      ? [
          {
            key: "alerts" as const,
            render: (i: number) => (
              <OnboardingPushStep role="creator" onDone={() => finish(i)} onSkip={() => finish(i, "skipped")} />
            ),
          },
        ]
      : []),
  ];

  const finished = step >= defs.length;
  useTrackStepViews(finished ? "done" : defs[step]?.key);

  if (finished) {
    return <OnboardingDone role="creator" name={name} emailVerified={emailVerified} payoutsStarted={payoutsStarted} />;
  }

  const inSetup = step < SETUP_STEPS.length;
  return (
    <div className="flex flex-col gap-8">
      {inSetup && (
        <>
          <OnboardingProgress step={step} total={SETUP_STEPS.length} labels={SETUP_STEPS.map((s) => s.label)} />
          <OnboardingProfileCard
            role="creator"
            name={name}
            avatarUrl={avatar}
            niches={niches}
            platforms={platforms}
          />
        </>
      )}
      <StepPanels step={step}>{defs.map((d, i) => d.render(i))}</StepPanels>
    </div>
  );
}

function NameStep({ value, onChange, onDone }: { value: string; onChange: (v: string) => void; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveDisplayNameAction, undefined);
  useStepDone(state, onDone);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading title="What should we call you?" description="Your display name, shown to brands you match with." />
      <input
        name="displayName"
        type="text"
        required
        autoFocus
        autoComplete="nickname"
        placeholder="e.g. Mia Summers"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-neutral-300 px-4 py-3 text-lg dark:border-neutral-700"
      />
      <StepError state={state} />
      <StepFooter pending={pending} disabled={!value.trim()} />
    </form>
  );
}

function NichesStep({
  value,
  onChange,
  onBack,
  onDone,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onBack: () => void;
  onDone: (insight?: OnboardingInsight) => void;
}) {
  const [state, formAction, pending] = useActionState(saveNichesAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading
        title="What are your niches?"
        description={`Pick up to ${MAX_CREATOR_NICHES}. Your feed shows requests in them first; you can switch it to everything that fits your reach.`}
      />
      <NicheTilesMulti name="niches" value={value} onChange={onChange} />
      <StepError state={state} />
      <StepFooter onBack={onBack} pending={pending} disabled={value.length === 0} />
    </form>
  );
}

function PlatformsStep({
  value,
  onChange,
  insight,
  onBack,
  onDone,
}: {
  value: PlatformDraft[];
  onChange: (v: PlatformDraft[]) => void;
  insight: OnboardingInsight | undefined;
  onBack: () => void;
  onDone: (insight?: OnboardingInsight) => void;
}) {
  const [state, formAction, pending] = useActionState(savePlatformsAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));
  const complete = value.length > 0 && value.every((e) => e.followers !== "" && e.url.trim() !== "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <InsightBanner insight={insight} />
        <StepHeading title="Where do you post?" description="Pick your platforms, then add your followers and the link to each profile (both are required), so brands can see your reach." />
      </div>
      <PlatformChips name="platforms" value={value} onChange={onChange} />
      <StepError state={state} />
      <StepFooter onBack={onBack} pending={pending} disabled={!complete} />
    </form>
  );
}
