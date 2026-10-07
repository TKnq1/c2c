import { cache } from "react";
import { readLocaleCookie } from "@/lib/i18n/cookie";
import { CATALOGS, createT } from "@/lib/i18n/catalogs";

export const getLocale = cache(readLocaleCookie);

export async function getT() {
  return createT(await getLocale());
}

// The active language's texts, for the client provider.
export async function getMessages() {
  return CATALOGS[await getLocale()];
}
