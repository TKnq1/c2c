"use client";

import { useActionState, useRef, useState } from "react";
import { IoCameraOutline } from "react-icons/io5";
import { saveOnboardingPhotoAction } from "@/lib/actions/onboarding";
import { resizeImageFile } from "@/lib/resize-image";
import { Avatar } from "@/components/avatar";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";
import { StepError, StepFooter, StepHeading, useStepDone } from "@/components/onboarding-ui";

// Optional photo (creators) or logo (brands), with a live preview of how the
// profile shows up to the other side. Skipping goes straight on.
export function OnboardingPhotoStep({
  kind,
  name,
  niches,
  onBack,
  onDone,
}: {
  kind: "photo" | "logo";
  name: string;
  niches: string[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveOnboardingPhotoAction, undefined);
  useStepDone(state, onDone);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const NicheIcon = NICHE_ICONS[niches[0]] ?? DEFAULT_NICHE_ICON;
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
            ? "Creators are far more likely to reply to a brand they recognize."
            : "Brands are far more likely to reach out to a face they can see."
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

      <div className="flex flex-col gap-2">
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          How {kind === "logo" ? "creators" : "brands"} will see you
        </p>
        <div className="flex items-center gap-3 rounded bg-fog px-4 py-3">
          <Avatar src={preview} name={name || "?"} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {niches.length > 0 && (
              <p className="flex items-center gap-1.5 text-footnote text-neutral-500 dark:text-neutral-400">
                <NicheIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {niches.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {readError && <p className="text-sm text-ink">{readError}</p>}
      <StepError state={state} />
      <div className="flex flex-col gap-3">
        <StepFooter onBack={onBack} pending={pending} disabled={!preview} />
        <button
          type="button"
          onClick={onDone}
          className="self-center text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}
