"use client";

import { useActionState } from "react";
import { confirmEmailVerificationAction } from "@/lib/actions/auth";
import { useActionToast } from "@/lib/use-action-toast";
import { useI18n } from "@/components/i18n-provider";
import { VerifyContinueLink } from "@/components/verify-continue-link";
import { localizeError } from "@/lib/i18n/labels";

// The mail's link only opens this page: the address counts as confirmed once the button here is
// pressed (mail scanners open links too, and must not confirm anything). So the step is spelled out.
export function ConfirmEmailVerificationForm({ token, continueTo }: { token: string; continueTo: { href: string; label: string } }) {
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
        <VerifyContinueLink href={continueTo.href} label={continueTo.label} />
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">{t("screens.ui.verifyStep")}</p>
      {state?.error && <p className="text-sm text-ink">{localizeError(state.error, t)}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-4 py-3.5 font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? t("screens.ui.verifying") : t("screens.ui.confirmVerification")}
      </button>
    </form>
  );
}
