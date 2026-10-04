"use client";

import { useState } from "react";
import { createProCheckoutSessionAction, cancelProAction } from "@/lib/actions/subscription";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { LocalDate } from "@/components/local-date";
import { formatCents } from "@/lib/format";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import { useI18n } from "@/components/i18n-provider";

// The contents of the Plan card on brand Settings (the card itself is the
// section's, see SettingsSection).
export function ProPlanCard({
  isPro,
  proSince,
  canPurchase,
}: {
  isPro: boolean;
  proSince: Date | null;
  // False in the store apps (see canSellProSubscription): shows the current
  // plan without any upgrade offer.
  canPurchase: boolean;
}) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setPending(true);
    setError(null);
    const result = await createProCheckoutSessionAction().catch(() => ({
      error: t("screens.settings.serverUnreachable"),
    }));
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.href = result.url;
  }

  if (isPro) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{t("screens.settings.proPlan")}</p>
          <span className="whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-paper">{t("screens.settings.active")}</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t("screens.settings.proFee", {
            pro: PRO_PLATFORM_FEE_RATE * 100,
            standard: PLATFORM_FEE_RATE * 100,
            price: formatCents(PRO_SUBSCRIPTION_PRICE_CENTS),
          })}
          {proSince && (
            <>
              {" "}
              {t("screens.settings.proSince", { date: "\u0000" }).split("\u0000")[0]}
              <LocalDate ms={proSince.getTime()} />
              {t("screens.settings.proSince", { date: "\u0000" }).split("\u0000")[1]}
            </>
          )}
        </p>
        <ConfirmActionButton
          action={cancelProAction}
          successMessage={t("screens.settings.proCancelled")}
          title={t("screens.settings.cancelProTitle")}
          description={t("screens.settings.cancelProBody", { rate: PLATFORM_FEE_RATE * 100 })}
          confirmLabel={t("screens.settings.cancelPro")}
          pendingLabel={t("screens.settings.cancelling")}
          className="self-start text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
        >
          {t("screens.settings.cancelPro")}
        </ConfirmActionButton>
      </div>
    );
  }

  if (!canPurchase) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{t("screens.settings.standardPlan")}</p>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("screens.settings.perPayment", { rate: PLATFORM_FEE_RATE * 100 })}</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.settings.standardFee", { rate: PLATFORM_FEE_RATE * 100 })}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{t("screens.settings.standardPlan")}</p>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("screens.settings.perPayment", { rate: PLATFORM_FEE_RATE * 100 })}</span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t("screens.settings.proPitch", {
          price: formatCents(PRO_SUBSCRIPTION_PRICE_CENTS),
          standard: PLATFORM_FEE_RATE * 100,
          pro: PRO_PLATFORM_FEE_RATE * 100,
          breakEven: formatCents(Math.round(PRO_SUBSCRIPTION_PRICE_CENTS / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE))),
        })}
      </p>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={pending}
        className="mt-1 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto sm:self-start"
      >
        {pending ? t("screens.settings.redirecting") : t("screens.settings.goPro", { price: formatCents(PRO_SUBSCRIPTION_PRICE_CENTS) })}
      </button>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
