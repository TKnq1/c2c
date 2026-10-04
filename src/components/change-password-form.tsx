"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { useActionToast } from "@/lib/use-action-toast";
import { NewPasswordField } from "@/components/new-password-field";
import { useUnsavedChanges } from "@/lib/navigation-blocker";
import { useI18n } from "@/components/i18n-provider";
import { localizeError } from "@/lib/i18n/labels";

export function ChangePasswordForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, t("screens.settings.passwordChanged"));
  const markDirty = useUnsavedChanges(state);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} onChange={markDirty} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-sm font-medium">
          {t("screens.settings.currentPassword")}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="rounded border border-neutral-300 px-3 py-2.5 dark:border-neutral-700"
        />
      </div>
      <NewPasswordField key={state?.success ? "done" : "editing"} name="newPassword" label={t("screens.settings.newPassword")} />
      {state?.error && <p className="text-sm text-ink">{localizeError(state.error, t)}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto sm:self-start"
      >
        {pending ? t("common.saving") : t("screens.settings.changePassword")}
      </button>
    </form>
  );
}
