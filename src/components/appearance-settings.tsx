"use client";

import { useLayoutEffect, useState } from "react";
import { getPreferredTheme, setTheme } from "@/lib/theme";
import { playSound, setSoundsEnabled, soundsEnabled } from "@/lib/sounds";
import { useI18n } from "@/components/i18n-provider";
import { LanguageChoices } from "@/components/language-choices";
import { SettingsRow } from "@/components/settings-section";
import { Switch } from "@/components/switch";

// Live switches, not form fields with a Save button — dark mode should
// apply the instant you flip it, the same way it always has from the nav
// icon this replaced; sounds likewise.
export function AppearanceSettings() {
  const { locale, setLocale, t } = useI18n();
  const [dark, setDark] = useState(false);
  const [sounds, setSounds] = useState(true);

  useLayoutEffect(() => {
    // Deferred a tick to avoid a synchronous setState-in-effect — still
    // resolves before paint in practice, so there's no visible flash of the
    // switch starting in the wrong position.
    queueMicrotask(() => {
      setDark(getPreferredTheme() === "dark");
      setSounds(soundsEnabled());
    });
  }, []);

  const toggleDark = (next: boolean) => {
    setTheme(next ? "dark" : "light");
    setDark(next);
  };

  const toggleSounds = (next: boolean) => {
    setSoundsEnabled(next);
    setSounds(next);
    // Turning them on plays one, so you hear what you just switched on.
    if (next) playSound("swipe-right");
  };

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-3">
        <div>
          <p className="text-sm font-medium">{t("settings.language")}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("settings.languageHint")}</p>
        </div>
        <LanguageChoices value={locale} onChange={setLocale} label={t("settings.language")} />
      </div>
      <SettingsRow label={t("settings.darkMode")} hint={t("settings.darkModeHint")}>
        <Switch checked={dark} onChange={toggleDark} label={t("settings.darkMode")} />
      </SettingsRow>
      <SettingsRow label={t("settings.sounds")} hint={t("settings.soundsHint")}>
        <Switch checked={sounds} onChange={toggleSounds} label={t("settings.sounds")} />
      </SettingsRow>
    </>
  );
}
