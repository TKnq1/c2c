"use client";

import { useEffect, useState } from "react";
import { generateEmailVerificationAction } from "@/lib/actions/auth";
import { useI18n } from "@/components/i18n-provider";
import { localizeError } from "@/lib/i18n/labels";

export function VerifyEmailLink() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateEmailVerificationAction().then((result) => {
      if (result?.sent) setSent(true);
      else if (result?.error) setError(result.error);
    });
  }, []);

  if (error) return <p className="text-sm text-ink">{localizeError(error, t)}</p>;
  if (!sent) return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("screens.ui.verifySending")}</p>;

  return <p className="text-sm text-neutral-700 dark:text-neutral-300">{t("screens.ui.verifySent")}</p>;
}
