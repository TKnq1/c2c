"use client";

import { useMemo } from "react";
import { useI18n } from "@/components/i18n-provider";
import { dealLocale } from "@/lib/deals/copy";
import { uiText } from "@/lib/deals/ui-copy";

// The deal screens' words for the language of the signed-in account (German, or English for every other language).
export function useDealText() {
  const { locale } = useI18n();
  return useMemo(() => uiText(dealLocale(locale)), [locale]);
}
