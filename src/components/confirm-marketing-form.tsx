"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmMarketingConsentAction } from "@/lib/actions/marketing-consent";
import { useI18n } from "@/components/i18n-provider";
import { Spinner } from "@/components/spinner";

export function ConfirmMarketingForm({ token, settingsHref }: { token: string; settingsHref: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(confirmMarketingConsentAction.bind(null, token), undefined);

  if (state?.ok) return <MarketingConfirmed settingsHref={settingsHref} />;

  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      <h1 className="font-display text-title-1 font-bold">{t("screens.marketing.confirmTitle")}</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.marketing.confirmBody")}</p>
      {state?.error && (
        <p role="alert" className="text-sm text-ink">
          {t("screens.marketing.linkInvalid")}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-graphite disabled:cursor-wait"
      >
        {pending ? <Spinner className="h-4 w-4" /> : t("screens.marketing.confirmButton")}
      </button>
    </form>
  );
}

export function MarketingConfirmed({ settingsHref }: { settingsHref: string }) {
  const { t } = useI18n();
  return (
    <div role="status" className="flex flex-col items-center gap-4">
      <h1 className="font-display text-title-1 font-bold">{t("screens.marketing.confirmedTitle")}</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.marketing.confirmedBody")}</p>
      <Link href={settingsHref} className="rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-graphite">
        {t("screens.marketing.toSettings")}
      </Link>
    </div>
  );
}
