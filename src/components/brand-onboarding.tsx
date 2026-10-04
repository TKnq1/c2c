"use client";

import { useActionState, useState } from "react";
import { saveCompanyNameAction, saveBrandNicheAction } from "@/lib/actions/onboarding";
import { NicheTiles } from "@/components/niche-tiles";
import { useI18n } from "@/components/i18n-provider";
import { OnboardingLanguageStep } from "@/components/onboarding-language-step";
import { OnboardingPhotoStep } from "@/components/onboarding-photo-step";
import { OnboardingDone } from "@/components/onboarding-done";
import { OnboardingProfileCard } from "@/components/onboarding-profile-card";
import { BrandAha } from "@/components/onboarding-aha";
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
import type { MessageKey } from "@/lib/i18n/translate";
import { BRAND_STEPS, type OnboardingEventKind, type OnboardingInsight, type OnboardingStepKey } from "@/lib/onboarding-flow";
import { trackOnboarding, useTrackStepViews } from "@/lib/use-onboarding-tracking";

// Language, then company name, niche and a logo (optional) build the
// profile; then the payoff: the creators already here in that niche,
// notifications (optional, and left out when they can't work here), and
// the "all set" screen.
const SETUP_STEPS = BRAND_STEPS.slice(0, 4);

type StepDef = { key: OnboardingStepKey; render: (index: number) => React.ReactNode };

export function BrandOnboarding({ emailVerified }: { emailVerified: boolean }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [niche, setNiche] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nicheInsight, setNicheInsight] = useState<OnboardingInsight | undefined>();
  const pushOffer = usePushOffer();

  const name = companyName.trim();
  const back = (i: number) => setStep(i - 1);

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
      key: "company",
      render: (i) => <CompanyNameStep value={companyName} onChange={setCompanyName} onDone={() => finish(i)} />,
    },
    {
      key: "niche",
      render: (i) => (
        <NicheStep
          value={niche}
          onChange={setNiche}
          onBack={() => back(i)}
          onDone={(insight) => {
            setNicheInsight(insight);
            finish(i);
          }}
        />
      ),
    },
    {
      key: "logo",
      render: (i) => (
        <>
          <InsightBanner insight={nicheInsight} />
          <OnboardingPhotoStep
            kind="logo"
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
      key: "creators",
      render: (i) => <BrandAha active={step === i} onNext={() => finish(i)} />,
    },
    ...(pushOffer
      ? [
          {
            key: "alerts" as const,
            render: (i: number) => (
              <OnboardingPushStep role="brand" onDone={() => finish(i)} onSkip={() => finish(i, "skipped")} />
            ),
          },
        ]
      : []),
  ];

  const finished = step >= defs.length;
  useTrackStepViews(finished ? "done" : defs[step]?.key);

  if (finished) {
    return <OnboardingDone role="brand" name={name} emailVerified={emailVerified} payoutsStarted={false} />;
  }

  const inSetup = step < SETUP_STEPS.length;
  return (
    <div className="flex flex-col gap-8">
      {inSetup && (
        <>
          <OnboardingProgress
            step={step}
            total={SETUP_STEPS.length}
            labels={SETUP_STEPS.map((s) => t(`onboarding.steps.${s.key}` as MessageKey))}
          />
          {step > 0 && <OnboardingProfileCard role="brand" name={name} avatarUrl={avatar} niches={niche ? [niche] : []} />}
        </>
      )}
      <StepPanels step={step}>{defs.map((d, i) => d.render(i))}</StepPanels>
    </div>
  );
}

function CompanyNameStep({ value, onChange, onDone }: { value: string; onChange: (v: string) => void; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(saveCompanyNameAction, undefined);
  useStepDone(state, onDone);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading title={t("onboarding.company.title")} description={t("onboarding.company.description")} />
      <input
        name="companyName"
        type="text"
        required
        autoFocus
        autoComplete="organization"
        placeholder={t("onboarding.company.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-neutral-300 px-4 py-3 text-lg dark:border-neutral-700"
      />
      <StepError state={state} />
      <StepFooter pending={pending} disabled={!value.trim()} />
    </form>
  );
}

function NicheStep({
  value,
  onChange,
  onBack,
  onDone,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onDone: (insight?: OnboardingInsight) => void;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(saveBrandNicheAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading title={t("onboarding.brandNiche.title")} description={t("onboarding.brandNiche.description")} />
      <NicheTiles name="niche" value={value} onChange={onChange} />
      <StepError state={state} />
      <StepFooter onBack={onBack} pending={pending} disabled={!value} />
    </form>
  );
}
