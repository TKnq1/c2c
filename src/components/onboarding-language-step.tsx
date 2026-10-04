"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { StepFooter, StepHeading } from "@/components/onboarding-ui";
import { APP_LOCALES, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/locales";

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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <StepHeading title={t("onboarding.language.title")} description={t("onboarding.language.description")} />
      <div role="radiogroup" aria-label={t("settings.language")} className="grid grid-cols-2 gap-2">
        {APP_LOCALES.map((item) => {
          const selected = picked === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPicked(item.id)}
              className={`flex items-center justify-between gap-2 rounded border px-4 py-3 text-left text-sm font-medium transition ${
                selected ? "border-ink bg-fog" : "border-neutral-300 hover:border-ink dark:border-neutral-700"
              }`}
            >
              {item.native}
              {selected && (
                <span aria-hidden className="text-ink">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <StepFooter pending={pending} />
    </form>
  );
}
