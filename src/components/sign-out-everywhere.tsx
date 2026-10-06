"use client";

import { signOutEverywhereAction } from "@/lib/actions/auth";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { SettingsRow } from "@/components/settings-section";
import { useI18n } from "@/components/i18n-provider";

// Ends every other session of the account (a lost phone, a shared computer); this one stays.
export function SignOutEverywhere() {
  const { t } = useI18n();
  return (
    <SettingsRow label={t("screens.settings.signOutEverywhere")} hint={t("screens.settings.signOutEverywhereHint")}>
      <ConfirmActionButton
        action={signOutEverywhereAction}
        successMessage={t("screens.settings.signedOutEverywhere")}
        title={t("screens.settings.signOutEverywhereTitle")}
        description={t("screens.settings.signOutEverywhereBody")}
        confirmLabel={t("screens.settings.signOutEverywhereConfirm")}
        className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-neutral-700"
      >
        {t("screens.settings.signOutEverywhereConfirm")}
      </ConfirmActionButton>
    </SettingsRow>
  );
}
