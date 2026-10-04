"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { updateNotificationPreferencesAction, type ActionState } from "@/lib/actions/notification-preferences";
import { SettingsRow } from "@/components/settings-section";
import { Switch } from "@/components/switch";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import { DEPOSITS_ENABLED } from "@/lib/constants";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

type Preferences = {
  notifyNewRequests: boolean;
  notifyNewInterest: boolean;
  notifyNewCreators: boolean;
  notifyMessages: boolean;
  notifyPayments: boolean;
  notifyDeposits: boolean;
};

// One switch per kind of notification, saved the moment it's flipped — no
// Save button to forget. Every save sends all six settings, including the
// ones this role never sees (and deposits while they're switched off): the
// action writes each field, so leaving any out would quietly turn it off.
export function NotificationPreferences({ role, preferences }: { role: Role; preferences: Preferences }) {
  const { t } = useI18n();
  const [values, setValues] = useState(preferences);
  const [pending, startTransition] = useTransition();

  const items: { key: keyof Preferences; label: MessageKey }[] = [];
  if (role === "CREATOR") items.push({ key: "notifyNewRequests", label: "screens.settings.prefRequests" });
  if (role === "STARTUP") items.push({ key: "notifyNewInterest", label: "screens.settings.prefInterest" });
  if (role === "STARTUP") items.push({ key: "notifyNewCreators", label: "screens.settings.prefCreators" });
  items.push({ key: "notifyMessages", label: "screens.settings.prefMessages" });
  items.push({ key: "notifyPayments", label: "screens.settings.prefPayments" });
  if (DEPOSITS_ENABLED) items.push({ key: "notifyDeposits", label: "screens.settings.prefDeposits" });

  const toggle = (key: keyof Preferences, next: boolean) => {
    const previous = values;
    const updated = { ...values, [key]: next };
    setValues(updated);
    const formData = new FormData();
    for (const [k, on] of Object.entries(updated)) if (on) formData.set(k, "on");
    startTransition(async () => {
      let result: ActionState;
      try {
        result = await updateNotificationPreferencesAction(undefined, formData);
      } catch (err) {
        result = { error: errorMessage(err) };
      }
      if (result?.error) {
        setValues(previous);
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      {items.map((item) => (
        <SettingsRow key={item.key} label={t(item.label)}>
          <Switch
            checked={values[item.key]}
            onChange={(next) => toggle(item.key, next)}
            disabled={pending}
            label={t(item.label)}
          />
        </SettingsRow>
      ))}
    </>
  );
}
