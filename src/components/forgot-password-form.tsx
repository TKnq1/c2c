"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { useI18n } from "@/components/i18n-provider";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.success) {
    return <p className="text-sm text-neutral-700 dark:text-neutral-300">{t("screens.auth.resetSent")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          {t("screens.auth.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded border border-neutral-300 px-3 py-2.5 dark:border-neutral-700"
        />
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? t("screens.auth.sending") : t("screens.auth.sendReset")}
      </button>
    </form>
  );
}
