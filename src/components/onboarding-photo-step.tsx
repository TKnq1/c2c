"use client";

import { useActionState, useRef, useState } from "react";
import { IoCameraOutline } from "react-icons/io5";
import { saveOnboardingPhotoAction } from "@/lib/actions/onboarding";
import { resizeImageFile } from "@/lib/resize-image";
import { SkipButton, StepError, StepFooter, StepHeading, useStepDone } from "@/components/onboarding-ui";

// Optional photo (creators) or logo (brands). The wizard's profile card
// above shows it as soon as one is picked (onPreview). Skipping goes
// straight on.
export function OnboardingPhotoStep({
  kind,
  onPreview,
  onBack,
  onDone,
  onSkip,
}: {
  kind: "photo" | "logo";
  onPreview: (dataUrl: string | null) => void;
  onBack: () => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveOnboardingPhotoAction, undefined);
  useStepDone(state, onDone);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const noun = kind === "logo" ? "logo" : "photo";

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReadError(null);
    try {
      // Same as AvatarUpload: submit the resized copy instead of the original.
      const { blob, dataUrl } = await resizeImageFile(file);
      const resized = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(resized);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(dataUrl);
      onPreview(dataUrl);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : "Couldn't read that image.");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <StepHeading
        title={kind === "logo" ? "Add your logo" : "Add a profile photo"}
        description={
          kind === "logo"
            ? "A logo makes your brand easy to recognise when creators scroll through requests."
            : "A real face makes your profile feel like a person, not a placeholder."
        }
      />

      <label className="group relative mx-auto cursor-pointer">
        <input ref={inputRef} type="file" name="avatar" accept="image/*" onChange={handleChange} className="sr-only" />
        {preview ? (
          // Data-URI preview of the picked file; nothing for next/image to do.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-32 w-32 rounded-full border border-ink/10 bg-white object-cover" />
        ) : (
          <span className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-neutral-300 text-neutral-500 transition group-hover:border-ink group-hover:text-ink dark:border-neutral-700 dark:text-neutral-400">
            <IoCameraOutline className="h-7 w-7" aria-hidden />
            <span className="text-xs font-medium">Choose {noun}</span>
          </span>
        )}
        {preview && (
          <span className="absolute right-0 bottom-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-ink text-paper">
            <IoCameraOutline className="h-4 w-4" aria-label={`Change ${noun}`} />
          </span>
        )}
      </label>

      {readError && <p className="text-sm text-ink">{readError}</p>}
      <StepError state={state} />
      <div className="flex flex-col gap-3">
        <StepFooter onBack={onBack} pending={pending} disabled={!preview} />
        <SkipButton onClick={onSkip} />
      </div>
    </form>
  );
}
