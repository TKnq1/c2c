"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { useI18n } from "@/components/i18n-provider";

const SHOWN_KEY = "email-verification-toast-shown";

// Pops up once per browser session as a toast, like every other notice,
// instead of a strip pinned above each page.
export function EmailVerificationBanner() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SHOWN_KEY) === "1") return;
      // Set before showing so StrictMode's double effect can't fire it twice.
      sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      // Storage unavailable (private mode etc.) — show it on this mount anyway.
    }
    toast.info(t("screens.auth.emailUnverified"), {
      action: { label: t("screens.auth.verifyNow"), onClick: () => router.push("/dashboard/verify-email") },
      durationMs: 10000,
    });
  }, [router, t]);

  return null;
}
