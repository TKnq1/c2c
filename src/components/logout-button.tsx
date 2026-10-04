"use client";

import { useI18n } from "@/components/i18n-provider";
import { logoutAction } from "@/lib/actions/auth";
import { disableNativePush, isNativeApp } from "@/lib/native-push-client";

export function LogoutButton({
  className = "rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-ink dark:border-neutral-700 dark:text-neutral-300",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  // In the store apps, detach this device's push token first — otherwise
  // the signed-out account keeps getting notifications on this phone.
  const logout = async () => {
    if (isNativeApp()) await disableNativePush();
    await logoutAction();
  };

  return (
    <form action={logout}>
      <button type="submit" className={className}>
        {children ?? t("nav.logOut")}
      </button>
    </form>
  );
}
