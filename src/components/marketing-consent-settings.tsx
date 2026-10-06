"use client";

import { useActionState } from "react";
import { requestMarketingConsentAction, withdrawMarketingConsentAction } from "@/lib/actions/marketing-consent";
import { useI18n } from "@/components/i18n-provider";

export function MarketingConsentSettings({ confirmed, pending }: { confirmed: boolean; pending: boolean }) {
  const { t } = useI18n();
  const [requestState, request, requestPending] = useActionState(requestMarketingConsentAction, undefined);
  const [stopState, stop, stopPending] = useActionState(withdrawMarketingConsentAction, undefined);

  const stopped = stopState?.status === "stopped";
  const on = confirmed && !stopped;
  const waiting = !stopped && (pending || requestState?.status === "sent" || requestState?.status === "soon");
  const status = requestState?.status;

  return (
    <form action={on ? stop : request} className="flex flex-col gap-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {on ? t("screens.marketing.settingsOn") : waiting ? t("screens.marketing.settingsPending") : t("screens.marketing.settingsOff")}
      </p>
      {status === "sent" && <p className="text-sm text-ink">{t("screens.marketing.sent")}</p>}
      {status === "already" && <p className="text-sm text-ink">{t("screens.marketing.already")}</p>}
      {status === "soon" && <p className="text-sm text-ink">{t("screens.marketing.soon")}</p>}
      {status === "failed" && <p className="text-sm text-ink">{t("screens.marketing.failed")}</p>}
      {stopped && <p className="text-sm text-ink">{t("screens.marketing.stopped")}</p>}
      <button
        type="submit"
        disabled={requestPending || stopPending}
        className="self-start rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {on ? t("screens.marketing.stop") : waiting ? t("screens.marketing.resend") : t("screens.marketing.send")}
      </button>
    </form>
  );
}
