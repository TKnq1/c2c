"use client";

import { logoutAction } from "@/lib/actions/auth";
import { disableNativePush, isNativeApp } from "@/lib/native-push-client";

export function LogoutButton() {
  // In the store apps, detach this device's push token first — otherwise
  // the signed-out account keeps getting notifications on this phone.
  const logout = async () => {
    if (isNativeApp()) await disableNativePush();
    await logoutAction();
  };

  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-ink hover:bg-fog transition dark:border-neutral-700 dark:text-neutral-300"
      >
        Log out
      </button>
    </form>
  );
}
