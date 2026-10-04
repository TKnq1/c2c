"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LanguageChoices } from "@/components/language-choices";
import { StepFooter, StepHeading, stepActions, stepScreen } from "@/components/onboarding-ui";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/locales";

function chosenLocale(): Locale | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return isLocale(value) ? value : null;
}

// First step for both roles, before a name exists, so everything after it
// is already in the chosen language. No Back: there is nothing behind it.
export function OnboardingLanguageStep({ onDone }: { onDone: () => void }) {
  const { locale, setLocale, t } = useI18n();
  const [picked, setPicked] = useState<Locale>(locale);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Deferred so the guess doesn't set state in the effect body. The step
    // still shows the account's language first; this only preselects the
    // browser language when nothing has been chosen yet.
    queueMicrotask(() => {
      if (chosenLocale()) return;
      const code = navigator.language.toLowerCase().split("-")[0];
      if (isLocale(code)) setPicked(code);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await setLocale(picked);
      onDone();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={stepScreen}>
      <StepHeading title={t("onboarding.language.title")} description={t("onboarding.language.description")} />
      <LanguageChoices value={picked} onChange={setPicked} label={t("settings.language")} />
      <div className={stepActions}>
        <StepFooter pending={pending} />
      </div>
    </form>
  );
}
