"use client";

import { FlagCircle } from "@/components/flag-circle";
import { APP_LOCALES, type Locale } from "@/lib/i18n/locales";

// The app-language list, with a circular flag beside each native name.
// Onboarding saves the choice on Continue; Settings applies it immediately.
export function LanguageChoices({ value, onChange, label }: { value: Locale; onChange: (locale: Locale) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
      {APP_LOCALES.map((item) => {
        const selected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2.5 rounded border px-3 py-3.5 text-left text-sm font-medium transition ${
              selected ? "border-ink bg-ink text-paper" : "border-neutral-300 hover:border-ink dark:border-neutral-700"
            }`}
          >
            <FlagCircle locale={item.id} ring={selected ? "text-white/40" : undefined} />
            <span className="min-w-0 flex-1">{item.native}</span>
            {selected && (
              <span aria-hidden className="text-paper">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
