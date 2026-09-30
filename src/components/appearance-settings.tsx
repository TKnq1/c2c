"use client";

import { useLayoutEffect, useState } from "react";
import { getPreferredTheme, setTheme } from "@/lib/theme";
import { SettingsRow } from "@/components/settings-section";
import { Switch } from "@/components/switch";

// A live switch, not a form field with a Save button — dark mode should
// apply the instant you flip it, the same way it always has from the nav
// icon this replaced.
export function AppearanceSettings() {
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    // Deferred a tick to avoid a synchronous setState-in-effect — still
    // resolves before paint in practice, so there's no visible flash of the
    // switch starting in the wrong position.
    queueMicrotask(() => setDark(getPreferredTheme() === "dark"));
  }, []);

  const toggle = (next: boolean) => {
    setTheme(next ? "dark" : "light");
    setDark(next);
  };

  return (
    <SettingsRow label="Dark mode" hint="Applies immediately on this device.">
      <Switch checked={dark} onChange={toggle} label="Dark mode" />
    </SettingsRow>
  );
}
