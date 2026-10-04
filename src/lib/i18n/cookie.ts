import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS, parseLocale, type Locale } from "@/lib/i18n/locales";

export async function readLocaleCookie(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function writeLocaleCookie(locale: Locale) {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
}
