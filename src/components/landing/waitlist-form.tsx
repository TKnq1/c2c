"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FiCheck, FiMail } from "react-icons/fi";
import { joinWaitlistAction } from "@/lib/actions/waitlist";
import { Spinner } from "@/components/spinner";
import { useLandingRole } from "@/components/landing/landing-role";
import { useI18n } from "@/components/i18n-provider";
import { localizeError } from "@/lib/i18n/labels";

// One email when the apps are out, after the address is confirmed (see
// joinWaitlistAction). Keeps which side the visitor picked, so the launch
// email can talk to creators and brands differently.
export function WaitlistForm() {
  const role = useLandingRole();
  const { t } = useI18n();
  const [state, action, pending] = useActionState(joinWaitlistAction, undefined);
  // Controlled, so a failed try doesn't wipe what was typed (React resets
  // an action form's own fields after every submit).
  const [email, setEmail] = useState("");

  if (state?.alreadyConfirmed) {
    return (
      <p role="status" className="lp-rise mx-auto mt-8 flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 font-medium text-paper">
        <FiCheck className="h-5 w-5 shrink-0" />
        {t("landing.waitlist.alreadyOn")}
      </p>
    );
  }

  if (state?.ok) {
    return (
      <div role="status" className="lp-rise mx-auto mt-8 flex max-w-md flex-col items-center gap-2">
        <p className="flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 font-medium text-paper">
          <FiMail className="h-5 w-5 shrink-0" />
          {t("landing.waitlist.checkInbox")}
        </p>
        <p className="text-sm text-neutral-800 dark:text-neutral-200">
          {t("landing.waitlist.confirmBefore")} <span className="font-semibold text-ink">{email}</span>{" "}
          {t("landing.waitlist.confirmAfter")}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mx-auto mt-8 w-full max-w-md text-left">
      <p className="lp-glow mb-3 text-center text-sm font-medium text-ink">
        {t("landing.waitlist.want")}
      </p>
      <input type="hidden" name="role" value={role ?? ""} />
      {/* For bots only: off screen and out of the tab order. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          {t("landing.waitlist.emailLabel")}
        </label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("landing.waitlist.placeholder")}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "waitlist-error" : undefined}
          className="min-w-0 flex-1 rounded border border-neutral-300 bg-paper/80 px-4 py-3 text-base backdrop-blur dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-graphite disabled:cursor-wait"
        >
          {pending ? (
            <span className="relative inline-flex items-center justify-center">
              <span className="invisible">{t("landing.waitlist.notify")}</span>
              <Spinner className="absolute h-4 w-4" />
            </span>
          ) : (
            t("landing.waitlist.notify")
          )}
        </button>
      </div>
      {state?.error && (
        <p id="waitlist-error" role="alert" className="mt-2 text-center text-sm font-medium text-ink">
          {localizeError(state.error, t)}
        </p>
      )}
      <p className="lp-glow mt-3 text-center text-footnote font-medium text-ink">
        {t("landing.waitlist.confirmFirst")}{" "}
        <Link href="/legal/privacy" className="underline underline-offset-2">
          {t("screens.settings.privacy")}
        </Link>
        .
      </p>
      <p className="lp-glow mt-6 text-center text-sm font-medium text-ink">
        {t("landing.waitlist.haveAccount")}{" "}
        <Link href="/login" className="font-semibold underline underline-offset-2">
          {t("landing.waitlist.logIn")}
        </Link>
      </p>
    </form>
  );
}
