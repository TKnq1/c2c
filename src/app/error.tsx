"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureClientError } from "@/lib/sentry-client";
import { LogoBackdrop } from "@/components/logo-backdrop";
import { useI18n } from "@/components/i18n-provider";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
    captureClientError(error);
  }, [error]);

  return (
    <LogoBackdrop>
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t("extras.errorPage.label")}</p>
          <h1 className="font-display text-title-1 font-bold mt-1">{t("extras.errorPage.title")}</h1>
          <p className="text-sm text-neutral-600 mt-2 dark:text-neutral-400">
            {t("extras.errorPage.body")}
          </p>
          {/* What the server log has this error under (Vercel logs, search
              for it), so a report can be traced to the real cause. */}
          {error.digest && (
            <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">{t("extras.errorPage.reference", { digest: error.digest })}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => retry()}
            className="rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:bg-graphite transition"
          >
            {t("extras.errorPage.retry")}
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-neutral-300 bg-paper px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          >
            {t("extras.errorPage.back")}
          </Link>
        </div>
      </div>
    </LogoBackdrop>
  );
}
