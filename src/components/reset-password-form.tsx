"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { NewPasswordField } from "@/components/new-password-field";
import { useI18n } from "@/components/i18n-provider";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(resetPasswordAction.bind(null, token), undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <NewPasswordField name="password" label={t("screens.settings.newPassword")} />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? t("common.saving") : t("screens.ui.resetPassword")}
      </button>
    </form>
  );
}
