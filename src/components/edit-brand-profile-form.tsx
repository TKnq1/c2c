"use client";

import { useActionState, useEffect } from "react";
import { updateBrandProfileAction } from "@/lib/actions/profile";
import { NICHES } from "@/lib/constants";
import { Select } from "@/components/select";
import { SocialLinksPicker } from "@/components/social-links-picker";
import { AvatarUpload } from "@/components/avatar-upload";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { useActionToast } from "@/lib/use-action-toast";
import { useNavigationBlocker } from "@/lib/navigation-blocker";

type Props = {
  companyName: string;
  avatarUrl: string | null;
  website: string;
  niche: string;
  description: string;
  lookingFor: string;
  socialLinks: { platform: string; url: string }[];
};

export function EditBrandProfileForm({
  companyName,
  avatarUrl,
  website,
  niche,
  description,
  lookingFor,
  socialLinks,
}: Props) {
  const [state, formAction, pending] = useActionState(updateBrandProfileAction, undefined);
  useActionToast(state, "Profile saved.");
  const { setIsBlocked } = useNavigationBlocker();
  useEffect(() => {
    if (state?.success) queueMicrotask(() => setIsBlocked(false));
  }, [state, setIsBlocked]);

  return (
    <form action={formAction} onChange={() => setIsBlocked(true)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Logo</span>
        <AvatarUpload name="avatar" initial={avatarUrl} emptyLabel="No logo" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="companyName" className="text-sm font-medium">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          defaultValue={companyName}
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="website" className="text-sm font-medium">
          Website
        </label>
        <input
          id="website"
          name="website"
          type="url"
          placeholder="https://yourbrand.com"
          defaultValue={website}
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
        <span className="text-sm font-medium">Social links</span>
        <SocialLinksPicker name="socialLinks" initial={socialLinks} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          About your brand
        </label>
        <TextareaWithCounter
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="What does your brand stand for?"
          defaultValue={description}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="lookingFor" className="text-sm font-medium">
          Additional requirements
        </label>
        <TextareaWithCounter
          id="lookingFor"
          name="lookingFor"
          rows={4}
          maxLength={2000}
          placeholder="Anything else creators should know before reaching out"
          defaultValue={lookingFor}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
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
