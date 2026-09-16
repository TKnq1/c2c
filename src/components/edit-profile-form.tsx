"use client";

import { useActionState, useEffect } from "react";
import { updateCreatorProfileAction } from "@/lib/actions/profile";
import { NICHES, LANGUAGES } from "@/lib/constants";
import { PlatformPicker } from "@/components/platform-picker";
import { Select } from "@/components/select";
import { AvatarUpload } from "@/components/avatar-upload";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { useActionToast } from "@/lib/use-action-toast";
import { useNavigationBlocker } from "@/lib/navigation-blocker";

type Props = {
  displayName: string;
  avatarUrl: string | null;
  niche: string;
  contentLanguage: string | null;
  bio: string | null;
  platforms: { platform: string; followerCount: number; url?: string | null }[];
};

export function EditProfileForm({
  displayName,
  avatarUrl,
  niche,
  contentLanguage,
  bio,
  platforms,
}: Props) {
  const [state, formAction, pending] = useActionState(updateCreatorProfileAction, undefined);
  useActionToast(state, "Profile saved.");
  const { setIsBlocked } = useNavigationBlocker();
  useEffect(() => {
    if (state?.success) queueMicrotask(() => setIsBlocked(false));
  }, [state, setIsBlocked]);

  return (
    <form action={formAction} onChange={() => setIsBlocked(true)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Photo</span>
        <AvatarUpload name="avatar" initial={avatarUrl} emptyLabel="No photo" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-sm font-medium">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="niche" className="text-sm font-medium">
          Niche
        </label>
        <Select id="niche" name="niche" defaultValue={niche} required>
          {NICHES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="contentLanguage" className="text-sm font-medium">
          Content language
        </label>
        <Select id="contentLanguage" name="contentLanguage" defaultValue={contentLanguage ?? "English"} required>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className="text-sm font-medium">
          About you
        </label>
        <TextareaWithCounter
          id="bio"
          name="bio"
          rows={4}
          maxLength={2000}
          placeholder="Tell brands a bit about yourself and your content"
          defaultValue={bio ?? ""}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Platforms &amp; followers</span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          The link is optional — add it so brands can check out your profile directly.
        </p>
        <PlatformPicker name="platforms" initial={platforms} />
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
