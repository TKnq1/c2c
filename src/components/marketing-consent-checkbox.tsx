"use client";

import { useI18n } from "@/components/i18n-provider";

// Optional, and never pre-checked. Ticking it is the consent: no
// confirmation email follows (see marketingConsentFromCheckbox).
export function MarketingConsentCheckbox() {
  const { t } = useI18n();
  return (
    <label className="flex items-start gap-2.5 text-left text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
      <input type="checkbox" name="marketing" value="yes" className="mt-0.5 size-4 shrink-0 accent-ink" />
      <span>{t("screens.marketing.checkbox")}</span>
    </label>
  );
}
