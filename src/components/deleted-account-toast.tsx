"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { useI18n } from "@/components/i18n-provider";

// Reads the query param directly (not useSearchParams) so this doesn't need
// its own Suspense boundary just for a one-shot toast.
export function DeletedAccountToast() {
  const { t } = useI18n();
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("deleted") === "1") {
      toast.info(t("screens.ui.accountDeleted"));
      // Strip the flag so StrictMode's dev-mode double-invoke (and any
      // later refresh) can't fire this a second time.
      url.searchParams.delete("deleted");
      window.history.replaceState({}, "", url);
    }
  }, [t]);
  return null;
}
