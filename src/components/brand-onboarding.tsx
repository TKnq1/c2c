"use client";

import { useActionState, useCallback, useState } from "react";
import { saveCompanyNameAction, saveBrandNicheAction } from "@/lib/actions/onboarding";
import { NicheTiles } from "@/components/niche-tiles";
import { OnboardingPhotoStep } from "@/components/onboarding-photo-step";
import { OnboardingDone } from "@/components/onboarding-done";
import {
  OnboardingProgress,
  StepError,
  StepFooter,
  StepHeading,
  StepPanels,
  useStepDone,
} from "@/components/onboarding-ui";

// Company name, niche, logo (optional), then the "all set" screen.
const STEPS = 3;

export function BrandOnboarding({ emailVerified }: { emailVerified: boolean }) {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [niche, setNiche] = useState("");
  const next = useCallback(() => setStep((s) => s + 1), []);
  const back = useCallback(() => setStep((s) => s - 1), []);

  if (step === STEPS) {
    return <OnboardingDone role="brand" name={companyName.trim()} emailVerified={emailVerified} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <OnboardingProgress step={step} total={STEPS} />
      <StepPanels step={step}>
        <CompanyNameStep value={companyName} onChange={setCompanyName} onDone={next} />
        <NicheStep value={niche} onChange={setNiche} onBack={back} onDone={next} />
        <OnboardingPhotoStep kind="logo" name={companyName.trim()} niches={niche ? [niche] : []} onBack={back} onDone={next} />
      </StepPanels>
    </div>
  );
}

function CompanyNameStep({ value, onChange, onDone }: { value: string; onChange: (v: string) => void; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveCompanyNameAction, undefined);
  useStepDone(state, onDone);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading title="What's your company called?" description="Shown to creators when you post a request or reach out." />
      <input
        name="companyName"
        type="text"
        required
        autoFocus
        autoComplete="organization"
        placeholder="e.g. Glow Beauty Co"
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
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveBrandNicheAction, undefined);
  useStepDone(state, onDone);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading title="What's your niche?" description="Shown on your brand profile, so creators know what you're about." />
      <NicheTiles name="niche" value={value} onChange={onChange} />
      <StepError state={state} />
      <StepFooter onBack={onBack} pending={pending} disabled={!value} />
    </form>
  );
}
