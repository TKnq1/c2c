"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setLocaleAction } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/locales";
import { createT, type TFunction } from "@/lib/i18n/translate";

type I18nValue = {
  locale: Locale;
  t: TFunction;
  setLocale: (locale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Holds the choice until the server render catches up, so the UI switches
  // before the refresh and doesn't snap back if that refresh is skipped.
  const [override, setOverride] = useState<Locale | null>(null);
  const current = override && override !== locale ? override : locale;

  const t = useMemo(() => createT(current), [current]);

  const setLocale = useCallback(
    async (next: Locale) => {
      setOverride(next);
      document.documentElement.lang = next;
      await setLocaleAction(next);
      // Onboarding keeps its step in client state. A refresh there can remount
      // the wizard back to the first step. Everywhere else, server-rendered
      // copy (page titles, settings headings) needs a fresh render.
      if (!pathname.startsWith("/onboarding")) router.refresh();
    },
    [pathname, router],
  );

  const value = useMemo(() => ({ locale: current, t, setLocale }), [current, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
