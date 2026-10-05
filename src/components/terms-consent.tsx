"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

// The account is only created if this box is checked. The server checks the
// same field, so a hidden form post without it does not get through.
export function TermsConsent() {
  const { t } = useI18n();
  return (
    <label className="flex items-start gap-2.5 text-left text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
      <input type="checkbox" name="terms" value="yes" required className="mt-0.5 size-4 shrink-0 accent-ink" />
      <span>
        {t("screens.ui.agreeCheck")}{" "}
        <Link href="/legal/terms" className="underline">
          {t("screens.settings.terms")}
        </Link>{" "}
        {t("screens.ui.andWord")}{" "}
        <Link href="/legal/privacy" className="underline">
          {t("screens.settings.privacy")}
        </Link>
        .
      </span>
    </label>
  );
}
