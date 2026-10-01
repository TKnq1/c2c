"use client";

import { useLayoutEffect, useState } from "react";
import { getPreferredTheme, setTheme } from "@/lib/theme";
import { playSound, setSoundsEnabled, soundsEnabled } from "@/lib/sounds";
import { SettingsRow } from "@/components/settings-section";
import { Switch } from "@/components/switch";

// Live switches, not form fields with a Save button — dark mode should
// apply the instant you flip it, the same way it always has from the nav
// icon this replaced; sounds likewise.
export function AppearanceSettings() {
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
      <SettingsRow label="Dark mode" hint="Applies immediately on this device.">
        <Switch checked={dark} onChange={toggleDark} label="Dark mode" />
      </SettingsRow>
      <SettingsRow label="Sounds" hint="A soft sound when you swipe in the Feed.">
        <Switch checked={sounds} onChange={toggleSounds} label="Sounds" />
      </SettingsRow>
    </>
  );
}
