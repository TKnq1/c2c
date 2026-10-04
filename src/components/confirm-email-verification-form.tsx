"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmEmailVerificationAction } from "@/lib/actions/auth";
import { useActionToast } from "@/lib/use-action-toast";
import { useI18n } from "@/components/i18n-provider";

export function ConfirmEmailVerificationForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(
    confirmEmailVerificationAction.bind(null, token),
    undefined,
  );
  useActionToast(state, t("screens.ui.emailVerified"));

  if (state?.success) {
    return (
      <>
        <p className="text-sm text-ink">{t("screens.ui.emailNowVerified")}</p>
        <Link href="/dashboard" className="font-medium text-neutral-900 underline dark:text-neutral-100">
          {t("screens.ui.goDashboard")}
        </Link>
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 items-center">
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? t("screens.ui.verifying") : t("screens.ui.confirmVerification")}
      </button>
    </form>
  );
}
