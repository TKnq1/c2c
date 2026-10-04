"use client";

import { useActionState, useState } from "react";
import { saveDisplayNameAction, saveNichesAction, savePlatformsAction } from "@/lib/actions/onboarding";
import { NicheTilesMulti } from "@/components/niche-tiles";
import { MAX_CREATOR_NICHES } from "@/lib/constants";
import { PlatformChips, type PlatformDraft } from "@/components/platform-chips";
import { useI18n } from "@/components/i18n-provider";
import { OnboardingLanguageStep } from "@/components/onboarding-language-step";
import { OnboardingPhotoStep } from "@/components/onboarding-photo-step";
import { OnboardingDone } from "@/components/onboarding-done";
import { CreatorAha } from "@/components/onboarding-aha";
import { OnboardingSwipeDemo } from "@/components/onboarding-swipe-demo";
import { OnboardingPayoutStep, PAYOUTS_AVAILABLE } from "@/components/onboarding-payout-step";
import { OnboardingPushStep, usePushOffer } from "@/components/onboarding-push-step";
import {
  FIELD_CLASS,
  InsightBanner,
  OnboardingProgress,
  StepError,
  StepFooter,
  StepHeading,
  StepPanels,
  stepActions,
  stepScreen,
  useStepDone,
} from "@/components/onboarding-ui";
import type { MessageKey } from "@/lib/i18n/translate";
import { CREATOR_STEPS, type OnboardingEventKind, type OnboardingInsight, type OnboardingStepKey } from "@/lib/onboarding-flow";
import { trackOnboarding, useTrackStepViews } from "@/lib/use-onboarding-tracking";

// Language, then name, niches, platforms and a photo (optional) build the
// profile; then the payoff: the matches waiting for it, how swiping works,
// payouts and notifications (each optional), and the "all set" screen.
// Payouts and notifications are left out when they can't work here.
const SETUP_STEPS = CREATOR_STEPS.slice(0, 5);

type StepDef = {
  key: OnboardingStepKey;
  render: (index: number) => React.ReactNode;
};

export function CreatorOnboarding({ emailVerified }: { emailVerified: boolean }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformDraft[]>([]);
  const [insights, setInsights] = useState<{
    niches?: OnboardingInsight;
    platforms?: OnboardingInsight;
  }>({});
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
      key: "language",
      render: (i) => <OnboardingLanguageStep onDone={() => finish(i)} />,
    },
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
          <OnboardingPhotoStep kind="photo" onBack={() => back(i)} onDone={() => finish(i)} onSkip={() => finish(i, "skipped")} />
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
            render: (i: number) => <OnboardingPushStep role="creator" onDone={() => finish(i)} onSkip={() => finish(i, "skipped")} />,
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
    <div className="flex flex-1 flex-col gap-5">
      {inSetup && (
        <OnboardingProgress
          step={step}
          total={SETUP_STEPS.length}
          labels={SETUP_STEPS.map((s) => t(`onboarding.steps.${s.key}` as MessageKey))}
        />
      )}
      <StepPanels step={step}>{defs.map((d, i) => d.render(i))}</StepPanels>
    </div>
  );
}

function NameStep({ value, onChange, onDone }: { value: string; onChange: (v: string) => void; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(saveDisplayNameAction, undefined);
  useStepDone(state, onDone);

  return (
    <form action={formAction} className={stepScreen}>
      <StepHeading title={t("onboarding.name.title")} description={t("onboarding.name.description")} />
      <input
        name="displayName"
        type="text"
        required
        autoFocus
        autoComplete="nickname"
        placeholder={t("onboarding.name.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLASS}
      />
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter pending={pending} disabled={!value.trim()} />
      </div>
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
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(saveNichesAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));

  return (
    <form action={formAction} className={stepScreen}>
      <StepHeading
        title={t("onboarding.niches.title")}
        description={t("onboarding.niches.description", {
          max: MAX_CREATOR_NICHES,
        })}
      />
      <NicheTilesMulti name="niches" value={value} onChange={onChange} />
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter onBack={onBack} pending={pending} disabled={value.length === 0} />
      </div>
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
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(savePlatformsAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));
  const complete = value.length > 0 && value.every((e) => e.followers !== "" && e.url.trim() !== "");

  return (
    <form action={formAction} className={stepScreen}>
      <div>
        <InsightBanner insight={insight} />
        <StepHeading title={t("onboarding.platforms.title")} description={t("onboarding.platforms.description")} />
      </div>
      <PlatformChips name="platforms" value={value} onChange={onChange} />
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter onBack={onBack} pending={pending} disabled={!complete} />
      </div>
    </form>
  );
}
