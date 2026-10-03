"use client";

import { useActionState, useState } from "react";
import { updateCreatorProfileAction } from "@/lib/actions/profile";
import { LANGUAGES, MAX_CREATOR_NICHES } from "@/lib/constants";
import { NicheTilesMulti } from "@/components/niche-tiles";
import { PlatformChips, type PlatformDraft } from "@/components/platform-chips";
import { Select } from "@/components/select";
import { AvatarUpload } from "@/components/avatar-upload";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { useActionToast } from "@/lib/use-action-toast";
import { useUnsavedChanges } from "@/lib/navigation-blocker";

type Props = {
  displayName: string;
  avatarUrl: string | null;
  niches: string[];
  contentLanguage: string | null;
  bio: string | null;
  platforms: { platform: string; followerCount: number; url?: string | null }[];
};

export function EditProfileForm({
  displayName,
  avatarUrl,
  niches,
  contentLanguage,
  bio,
  platforms,
}: Props) {
  const [state, formAction, pending] = useActionState(updateCreatorProfileAction, undefined);
  const [nicheDrafts, setNicheDrafts] = useState(niches);
  const [platformDrafts, setPlatformDrafts] = useState<PlatformDraft[]>(() =>
    platforms.map((p) => ({ platform: p.platform, followers: String(p.followerCount), url: p.url ?? "" })),
  );
  useActionToast(state, "Profile saved.");
  const markDirty = useUnsavedChanges(state);

  return (
    <form action={formAction} onChange={markDirty} className="flex flex-col gap-4">
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
          className="rounded border border-neutral-300 px-3 py-2.5 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Niches</span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Up to {MAX_CREATOR_NICHES}. Your Feed&apos;s For you shows requests in them.
        </p>
        <NicheTilesMulti name="niches" value={nicheDrafts} onChange={setNicheDrafts} />
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
          className="rounded border border-neutral-300 px-3 py-2.5 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Platforms &amp; followers</span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Followers and a link for each, so brands can check out your profile directly.
        </p>
        <PlatformChips
          name="platforms"
          value={platformDrafts}
          onChange={(next) => {
            setPlatformDrafts(next);
            // Chip taps aren't input events, so the form's onChange misses them.
            markDirty();
          }}
        />
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto sm:self-start"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
