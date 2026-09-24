"use client";

import { useActionState, useEffect, useState } from "react";
import { NICHES } from "@/lib/constants";
import { Select } from "@/components/select";
import { PlatformPicker } from "@/components/platform-picker";
import { saveDisplayNameAction, saveNicheAction, finishCreatorOnboardingAction } from "@/lib/actions/onboarding";

const STEP_LABELS = ["Display name", "Niche", "Platforms"];

export function CreatorOnboarding() {
  const [step, setStep] = useState(0);

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-1.5">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-fog"}`} />
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
          Step {step + 1} of {STEP_LABELS.length}
        </p>
      </div>

      {step === 0 && <DisplayNameStep onDone={() => setStep(1)} />}
      {step === 1 && <NicheStep onBack={() => setStep(0)} onDone={() => setStep(2)} />}
      {step === 2 && <PlatformsStep onBack={() => setStep(1)} />}
    </div>
  );
}

function DisplayNameStep({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveDisplayNameAction, undefined);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-title-2 font-bold">What should we call you?</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Your display name, shown to brands you match with.
        </p>
      </div>
      <input
        name="displayName"
        type="text"
        required
        autoFocus
        placeholder="Display name"
        className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
      />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

function NicheStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveNicheAction, undefined);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-title-2 font-bold">What&apos;s your niche?</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Brands filter requests by this, so pick the closest fit.
        </p>
      </div>
      <Select name="niche" required defaultValue="">
        <option value="" disabled>
          Select a niche
        </option>
        {NICHES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-neutral-300 text-neutral-600 px-4 py-2 font-medium hover:border-ink transition dark:border-neutral-700 dark:text-neutral-400"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}

function PlatformsStep({ onBack }: { onBack: () => void }) {
  const [state, formAction, pending] = useActionState(finishCreatorOnboardingAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-title-2 font-bold">Where do you post?</h1>
        <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
          Add at least one platform so brands can see your reach.
        </p>
      </div>
      <PlatformPicker name="platforms" />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-neutral-300 text-neutral-600 px-4 py-2 font-medium hover:border-ink transition dark:border-neutral-700 dark:text-neutral-400"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
        >
          {pending ? "Finishing…" : "Finish"}
        </button>
      </div>
    </form>
  );
}
