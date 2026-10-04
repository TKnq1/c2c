"use client";

import { IoPrintOutline } from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";

export function PrintButton() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label={t("screens.payments.savePdf")}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
    >
      <IoPrintOutline className="h-4 w-4" />
      PDF
    </button>
  );
}
