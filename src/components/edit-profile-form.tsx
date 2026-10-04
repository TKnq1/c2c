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
import { useFormProblem } from "@/lib/use-form-problem";
import { useI18n } from "@/components/i18n-provider";
import { contentLanguageLabel, localizeError } from "@/lib/i18n/labels";

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
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(updateCreatorProfileAction, undefined);
  const [nicheDrafts, setNicheDrafts] = useState(niches);
  const [platformDrafts, setPlatformDrafts] = useState<PlatformDraft[]>(() =>
    platforms.map((p) => ({ platform: p.platform, followers: String(p.followerCount), url: p.url ?? "" })),
  );
  useActionToast(state, t("screens.settings.profileSaved"));
  const markDirty = useUnsavedChanges(state);
  const { formRef, problem, clearProblem } = useFormProblem();
  const message = problem ?? (state?.error ? localizeError(state.error, t) : undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={() => {
        markDirty();
        clearProblem();
      }}
      onSubmit={clearProblem}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("screens.settings.photo")}</span>
        <AvatarUpload name="avatar" initial={avatarUrl} emptyLabel={t("screens.settings.noPhoto")} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-sm font-medium">
          {t("screens.settings.displayName")}
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
        <span className="text-sm font-medium">{t("screens.settings.niches")}</span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t("screens.settings.nichesHint", { max: MAX_CREATOR_NICHES })}
        </p>
        <NicheTilesMulti name="niches" value={nicheDrafts} onChange={setNicheDrafts} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="contentLanguage" className="text-sm font-medium">
          {t("screens.settings.contentLanguage")}
        </label>
        <Select id="contentLanguage" name="contentLanguage" defaultValue={contentLanguage ?? "English"} required>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {contentLanguageLabel(t, l)}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className="text-sm font-medium">
          {t("screens.settings.aboutYou")}
        </label>
        <TextareaWithCounter
          id="bio"
          name="bio"
          rows={4}
          maxLength={2000}
          placeholder={t("screens.settings.aboutYouPlaceholder")}
          defaultValue={bio ?? ""}
          className="rounded border border-neutral-300 px-3 py-2.5 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("screens.settings.platforms")}</span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("screens.settings.platformsHint")}</p>
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
      {message && (
        <p role="alert" className="text-sm font-medium text-ink">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto sm:self-start"
      >
        {pending ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
