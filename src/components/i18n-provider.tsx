"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setLocaleAction } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/locales";
import { loadCatalog } from "@/lib/i18n/load-catalog";
import type { Catalog } from "@/lib/i18n/messages/types";
import { makeT, type TFunction } from "@/lib/i18n/translate";

type I18nValue = {
  locale: Locale;
  t: TFunction;
  setLocale: (locale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nValue | null>(null);

// `messages` is the page language's catalog only; another language is fetched when the visitor picks it.
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Catalog; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Holds the choice until the server render catches up, so the UI switches
  // before the refresh and doesn't snap back if that refresh is skipped.
  const [override, setOverride] = useState<{ locale: Locale; messages: Catalog } | null>(null);
  const active = override && override.locale !== locale ? override : { locale, messages };
  const current = active.locale;

  const t = useMemo(() => makeT(active.messages), [active.messages]);

  const setLocale = useCallback(
    async (next: Locale) => {
      setOverride({ locale: next, messages: await loadCatalog(next) });
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
