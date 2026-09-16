"use client";

import { useActionState } from "react";
import type { Role } from "@prisma/client";
import { updateNotificationPreferencesAction } from "@/lib/actions/notification-preferences";
import { useActionToast } from "@/lib/use-action-toast";

type Preferences = {
  notifyNewRequests: boolean;
  notifyNewInterest: boolean;
  notifyNewCreators: boolean;
  notifyMessages: boolean;
  notifyPayments: boolean;
  notifyDeposits: boolean;
};

export function NotificationPreferences({ role, preferences }: { role: Role; preferences: Preferences }) {
  const [state, formAction, pending] = useActionState(updateNotificationPreferencesAction, undefined);
  useActionToast(state, "Notification preferences saved.");

  const items: { key: keyof Preferences; label: string }[] = [];
  if (role === "CREATOR") items.push({ key: "notifyNewRequests", label: "New matching requests" });
  if (role === "STARTUP") items.push({ key: "notifyNewInterest", label: "New interest in your requests" });
  if (role === "STARTUP") items.push({ key: "notifyNewCreators", label: "New matching creators" });
  items.push({ key: "notifyMessages", label: "Messages" });
  items.push({ key: "notifyPayments", label: "Payments" });
  items.push({ key: "notifyDeposits", label: "Deposits" });

  return (
    <form action={formAction} className="flex flex-col gap-2 mt-4">
      <p className="text-sm font-medium">Notify me about</p>
      {items.map((item) => (
        <label key={item.key} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            name={item.key}
            defaultChecked={preferences[item.key]}
            className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
          />
          {item.label}
        </label>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition disabled:opacity-50 self-start dark:border-neutral-700 dark:hover:bg-neutral-800/50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
    </form>
  );
}
