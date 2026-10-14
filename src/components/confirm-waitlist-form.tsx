"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmWaitlistAction } from "@/lib/actions/waitlist";
import { Spinner } from "@/components/spinner";
import { useI18n } from "@/components/i18n-provider";
import { localizeError } from "@/lib/i18n/labels";

// The heading and text live here too, so the whole block turns into the
// confirmation once the button is pressed.
export function ConfirmWaitlistForm({ token, email }: { token: string; email: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(confirmWaitlistAction.bind(null, token), undefined);

  if (state?.ok) return <WaitlistConfirmed />;

  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      <h1 className="font-display text-title-1 font-bold">{t("extras.waitlist.confirmTitle")}</h1>
      <p className="text-sm font-semibold text-ink">{email}</p>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("extras.waitlist.confirmBody")}</p>
      {state?.error && (
        <p role="alert" className="text-sm text-ink">
          {localizeError(state.error, t)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-graphite disabled:cursor-wait"
      >
        {pending ? (
          <span className="relative inline-flex items-center justify-center">
            <span className="invisible">{t("extras.waitlist.confirmButton")}</span>
            <Spinner className="absolute h-4 w-4" />
          </span>
        ) : (
          t("extras.waitlist.confirmButton")
        )}
      </button>
    </form>
  );
}

// Also what the page shows when the link is opened again later.
export function WaitlistConfirmed() {
  const { t } = useI18n();
  return (
    <div role="status" className="flex flex-col items-center gap-4">
      <h1 className="font-display text-title-1 font-bold">{t("extras.waitlist.doneTitle")}</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("extras.waitlist.doneBody")}</p>
      <Link
        href="/signup"
        className="rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-graphite"
      >
        {t("extras.waitlist.doneCta")}
      </Link>
    </div>
  );
}
