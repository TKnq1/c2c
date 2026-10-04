"use client";

import { useLayoutEffect, useState } from "react";
import { getPreferredTheme, setTheme } from "@/lib/theme";
import { playSound, setSoundsEnabled, soundsEnabled } from "@/lib/sounds";
import { useI18n } from "@/components/i18n-provider";
import { Select } from "@/components/select";
import { SettingsRow } from "@/components/settings-section";
import { Switch } from "@/components/switch";
import { APP_LOCALES, type Locale } from "@/lib/i18n/locales";

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
      <SettingsRow label={t("settings.language")} hint={t("settings.languageHint")}>
        <Select
          aria-label={t("settings.language")}
          value={locale}
          wrapperClassName="w-40 shrink-0"
          className="py-2 text-sm"
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {APP_LOCALES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.native}
            </option>
          ))}
        </Select>
      </SettingsRow>
      <SettingsRow label={t("settings.darkMode")} hint={t("settings.darkModeHint")}>
        <Switch checked={dark} onChange={toggleDark} label={t("settings.darkMode")} />
      </SettingsRow>
      <SettingsRow label={t("settings.sounds")} hint={t("settings.soundsHint")}>
        <Switch checked={sounds} onChange={toggleSounds} label={t("settings.sounds")} />
      </SettingsRow>
    </>
  );
}
