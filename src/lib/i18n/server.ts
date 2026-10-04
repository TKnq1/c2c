import { cache } from "react";
import { readLocaleCookie } from "@/lib/i18n/cookie";
import { createT } from "@/lib/i18n/translate";

export const getLocale = cache(readLocaleCookie);

export async function getT() {
  return createT(await getLocale());
}
