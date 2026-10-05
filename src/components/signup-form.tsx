"use client";

import { useActionState, useState } from "react";
import { signupAction } from "@/lib/actions/auth";
import { NewPasswordField } from "@/components/new-password-field";
import { TermsConsent } from "@/components/terms-consent";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, RELEASE_REVIEW_DAYS } from "@/lib/constants";

import type { SignupRole } from "@/lib/signup-role";
import { useI18n } from "@/components/i18n-provider";
import { localizeError } from "@/lib/i18n/labels";

export type { SignupRole };


type Props = {
  // Uncontrolled by default (own toggle, own state) — the standalone
  // /signup page uses it this way, starting from the side the visitor came
  // from (initialRole). The homepage passes role and onRoleChange so the
  // same Brand/Creator choice also drives what's shown on its left column.
  role?: SignupRole;
  onRoleChange?: (role: SignupRole) => void;
  initialRole?: SignupRole | null;
};

// Just email/password/role — company name, or display name/niche/platforms,
// are collected right after by the /onboarding wizard, one field at a time,
// so the bar to actually creating an account stays low.
export function SignupForm({ role: controlledRole, onRoleChange, initialRole = null }: Props = {}) {
  // Nothing is preselected without a side to start from: an account's role
  // can't be changed afterwards, and a guess (it used to be Brand) turned
  // creators who only typed an email and a password into brands.
  const [internalRole, setInternalRole] = useState<SignupRole | null>(initialRole);
  const role = controlledRole ?? internalRole;
  const setRole = onRoleChange ?? setInternalRole;
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(signupAction, undefined);
  const feeNote =
    role === "STARTUP"
      ? t("screens.auth.feeBrand", { standard: PLATFORM_FEE_RATE * 100, pro: PRO_PLATFORM_FEE_RATE * 100 })
      : role === "CREATOR"
        ? t("screens.auth.feeCreator", {
            keep: 100 - PLATFORM_FEE_RATE * 100,
            keepPro: 100 - PRO_PLATFORM_FEE_RATE * 100,
            days: RELEASE_REVIEW_DAYS,
          })
        : t("screens.auth.chooseRole");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded bg-fog p-1">
        <button
          type="button"
          aria-pressed={role === "STARTUP"}
          onClick={() => setRole("STARTUP")}
          className={`rounded py-2 text-sm font-medium transition ${
            role === "STARTUP" ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {t("screens.auth.imBrand")}
        </button>
        <button
          type="button"
          aria-pressed={role === "CREATOR"}
          onClick={() => setRole("CREATOR")}
          className={`rounded py-2 text-sm font-medium transition ${
            role === "CREATOR" ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {t("screens.auth.imCreator")}
        </button>
      </div>
      <input type="hidden" name="role" value={role ?? ""} />
      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        {feeNote}
      </p>

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
      <NewPasswordField name="password" />
      <TermsConsent />

      {state?.error && <p className="text-sm text-ink">{localizeError(state.error, t)}</p>}
      <button
        type="submit"
        disabled={pending || !role}
        className="rounded-full bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? t("screens.auth.creating") : t("screens.auth.create")}
      </button>
    </form>
  );
}
