"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/lib/actions/account";
import { Dialog } from "@/components/dialog";
import { SettingsRow } from "@/components/settings-section";
import { useI18n } from "@/components/i18n-provider";
import { localizeError } from "@/lib/i18n/labels";

// Behind its own sheet, with the password as the confirmation — the same
// sheet every other can't-be-undone action in the app uses, rather than a
// form unfolding in the middle of the settings.
export function DeleteAccountForm() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccountAction, undefined);

  return (
    <>
      <SettingsRow label={t("screens.settings.deleteAccount")} hint={t("screens.settings.deleteHint")}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-neutral-700"
        >
          {t("common.delete")}
        </button>
      </SettingsRow>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("screens.settings.deleteTitle")}>
        <form action={formAction} className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.settings.deleteBody")}</p>
          {/* text-base on phones: iOS zooms into any field under 16px on focus. */}
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder={t("screens.settings.yourPassword")}
            aria-label={t("screens.settings.password")}
            className="rounded border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
          />
          {state?.error && <p className="text-sm font-medium text-ink">{localizeError(state.error, t)}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
            >
              {pending ? t("screens.settings.deleting") : t("screens.settings.deleteForever")}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
