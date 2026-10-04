"use client";

import { useState } from "react";
import Link from "next/link";
import { SignupForm, type SignupRole } from "@/components/signup-form";
import { LoginForm } from "@/components/login-form";
import { useI18n } from "@/components/i18n-provider";

type Props = {
  role: SignupRole;
  onRoleChange: (role: SignupRole) => void;
};

export function AuthPanel({ role, onRoleChange }: Props) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"signup" | "login">("signup");

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="flex items-center gap-5 border-b border-ink/10">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`pb-3 -mb-px border-b-2 text-sm transition ${
            mode === "signup"
              ? "border-ink font-semibold"
              : "border-transparent text-neutral-500 hover:text-ink dark:text-neutral-400"
          }`}
        >
          {t("screens.auth.signUp")}
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`pb-3 -mb-px border-b-2 text-sm transition ${
            mode === "login"
              ? "border-ink font-semibold"
              : "border-transparent text-neutral-500 hover:text-ink dark:text-neutral-400"
          }`}
        >
          {t("screens.auth.logIn")}
        </button>
      </div>

      {mode === "signup" ? (
        <>
          <div>
            <h2 className="font-display text-title-2 font-bold">{t("screens.ui.createAccount")}</h2>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">{t("screens.ui.getStarted")}</p>
          </div>
          <SignupForm role={role} onRoleChange={onRoleChange} />
          <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
            {t("screens.ui.agreeLead")}{" "}
            <Link href="/legal/terms" className="underline">
              {t("screens.settings.terms")}
            </Link>{" "}
            {t("screens.ui.andWord")}{" "}
            <Link href="/legal/privacy" className="underline">
              {t("screens.settings.privacy")}
            </Link>
            .
          </p>
        </>
      ) : (
        <>
          <div>
            <h2 className="font-display text-title-2 font-bold">{t("screens.auth.welcome")}</h2>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">{t("screens.auth.loginHint")}</p>
          </div>
          <LoginForm />
          <Link
            href="/forgot-password"
            className="text-sm text-center font-medium text-neutral-900 underline dark:text-neutral-100"
          >
            {t("screens.auth.forgot")}
          </Link>
        </>
      )}
    </div>
  );
}
