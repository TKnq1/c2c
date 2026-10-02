"use client";

import { useActionState, useCallback, useState } from "react";
import { saveDisplayNameAction, saveNichesAction, savePlatformsAction } from "@/lib/actions/onboarding";
import { NicheTilesMulti } from "@/components/niche-tiles";
import { MAX_CREATOR_NICHES } from "@/lib/constants";
import { PlatformChips, type PlatformDraft } from "@/components/platform-chips";
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

// Name, niches, platforms, photo (optional), then the "all set" screen.
const STEPS = 4;

export function CreatorOnboarding({ emailVerified }: { emailVerified: boolean }) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformDraft[]>([]);
  const next = useCallback(() => setStep((s) => s + 1), []);
  const back = useCallback(() => setStep((s) => s - 1), []);

  if (step === STEPS) {
    return <OnboardingDone role="creator" name={displayName.trim()} emailVerified={emailVerified} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <OnboardingProgress step={step} total={STEPS} />
      <StepPanels step={step}>
        <NameStep value={displayName} onChange={setDisplayName} onDone={next} />
        <NichesStep value={niches} onChange={setNiches} onBack={back} onDone={next} />
        <PlatformsStep value={platforms} onChange={setPlatforms} onBack={back} onDone={next} />
        <OnboardingPhotoStep kind="photo" name={displayName.trim()} niches={niches} onBack={back} onDone={next} />
      </StepPanels>
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
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveNichesAction, undefined);
  useStepDone(state, onDone);

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
  onBack,
  onDone,
}: {
  value: PlatformDraft[];
  onChange: (v: PlatformDraft[]) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(savePlatformsAction, undefined);
  useStepDone(state, onDone);
  const complete = value.length > 0 && value.every((e) => e.followers !== "" && e.url.trim() !== "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading title="Where do you post?" description="Pick your platforms, then add your followers and the link to each profile, so brands can see your reach." />
      <PlatformChips name="platforms" value={value} onChange={onChange} />
      <StepError state={state} />
      <StepFooter onBack={onBack} pending={pending} disabled={!complete} />
    </form>
  );
}
