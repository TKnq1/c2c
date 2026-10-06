"use client";

import { useI18n } from "@/components/i18n-provider";

// The landing page is written in German and English. Everything else falls back to English, so only those two
// are offered here; the rest of the languages are chosen in the app itself.
const CHOICES = [
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
] as const;

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t("landing.footer.language")} className="flex items-center gap-1">
      {CHOICES.map((choice, i) => (
        <span key={choice.id} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">·</span>}
          <button
            type="button"
            lang={choice.id}
            aria-pressed={locale === choice.id}
            onClick={() => void setLocale(choice.id)}
            className={`transition hover:text-ink ${locale === choice.id ? "font-semibold text-ink" : ""}`}
          >
            {choice.label}
          </button>
        </span>
      ))}
    </div>
  );
}
