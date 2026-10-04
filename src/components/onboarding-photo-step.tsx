"use client";

import { useActionState, useRef, useState } from "react";
import { IoCameraOutline } from "react-icons/io5";
import { saveOnboardingPhotoAction } from "@/lib/actions/onboarding";
import { resizeImageFile } from "@/lib/resize-image";
import { useI18n } from "@/components/i18n-provider";
import { SkipButton, StepError, StepFooter, StepHeading, stepActions, stepScreen, useStepDone } from "@/components/onboarding-ui";

// Optional photo (creators) or logo (brands). The circle shows the pick
// immediately. Skipping goes straight on.
export function OnboardingPhotoStep({
  kind,
  onPreview,
  onBack,
  onDone,
  onSkip,
}: {
  kind: "photo" | "logo";
  onPreview?: (dataUrl: string | null) => void;
  onBack: () => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(saveOnboardingPhotoAction, undefined);
  useStepDone(state, onDone);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const title = kind === "logo" ? t("onboarding.logo.title") : t("onboarding.photo.title");
  const description = kind === "logo" ? t("onboarding.logo.description") : t("onboarding.photo.description");
  const choose = kind === "logo" ? t("onboarding.logo.choose") : t("onboarding.photo.choose");
  const change = kind === "logo" ? t("onboarding.logo.change") : t("onboarding.photo.change");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReadError(null);
    try {
      // Same as AvatarUpload: submit the resized copy instead of the original.
      const { blob, dataUrl } = await resizeImageFile(file);
      const resized = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
        type: "image/jpeg",
      });
      const dt = new DataTransfer();
      dt.items.add(resized);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(dataUrl);
      onPreview?.(dataUrl);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : t("onboarding.photo.readError"));
    }
  }

  return (
    <form action={formAction} className={stepScreen}>
      <StepHeading title={title} description={description} />

      <div className="flex flex-1 items-center justify-center sm:flex-none sm:py-2">
        <label className="group relative cursor-pointer">
          <input ref={inputRef} type="file" name="avatar" accept="image/*" onChange={handleChange} className="sr-only" />
          {preview ? (
            // Data-URI preview of the picked file; nothing for next/image to do.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-44 w-44 rounded-full border border-ink/10 bg-white object-cover" />
          ) : (
            <span className="flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-neutral-400 bg-fog text-neutral-600 transition group-hover:border-ink group-hover:text-ink dark:border-neutral-600 dark:text-neutral-300">
              <IoCameraOutline className="h-8 w-8" aria-hidden />
              <span className="text-sm font-medium">{choose}</span>
            </span>
          )}
          {preview && (
            <span className="absolute right-1 bottom-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-ink text-paper">
              <IoCameraOutline className="h-4 w-4" aria-label={change} />
            </span>
          )}
        </label>
      </div>

      {readError && <p className="text-sm text-ink">{readError}</p>}
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter onBack={onBack} pending={pending} disabled={!preview} />
        <SkipButton onClick={onSkip} />
      </div>
    </form>
  );
}
