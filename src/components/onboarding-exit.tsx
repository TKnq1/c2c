"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { useI18n } from "@/components/i18n-provider";

export const ONBOARDING_ACCOUNT_EVENT = "comtor-onboarding-account";

// Guests get a way to an existing account. Once this visit creates one,
// the same corner becomes log out — the page itself does not reload.
export function OnboardingExit({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useI18n();
  const [hasAccount, setHasAccount] = useState(loggedIn);

  useEffect(() => {
    if (loggedIn) return;
    const onAccount = () => setHasAccount(true);
    window.addEventListener(ONBOARDING_ACCOUNT_EVENT, onAccount);
    return () => window.removeEventListener(ONBOARDING_ACCOUNT_EVENT, onAccount);
  }, [loggedIn]);

  const className = "text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400";
  if (hasAccount) return <LogoutButton className={className} />;
  return (
    <Link href="/login" className={className}>
      {t("screens.auth.logIn")}
    </Link>
  );
}
