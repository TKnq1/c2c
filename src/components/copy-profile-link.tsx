"use client";

import { FiLink } from "react-icons/fi";
import { toast } from "@/lib/toast";
import { useI18n } from "@/components/i18n-provider";

// The link only resolves for someone already signed in with the matching
// role (Discover is role-gated, not a public profile page) — useful to
// send to a brand/creator you're already in touch with elsewhere, not a
// public "add to bio" link. The note under the button says so.
export function CopyProfileLink({ url }: { url: string }) {
  const { t } = useI18n();
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("screens.settings.linkCopied"));
    } catch {
      toast.error(t("screens.settings.linkCopyFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-2 self-start rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
      >
        <FiLink className="h-4 w-4" />
        {t("screens.settings.copyLink")}
      </button>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("screens.settings.linkHint")}</p>
    </div>
  );
}
