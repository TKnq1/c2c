"use client";

import { useState } from "react";
import { createProCheckoutSessionAction, cancelProAction } from "@/lib/actions/subscription";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { LocalDate } from "@/components/local-date";
import { formatCents } from "@/lib/format";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";

// The contents of the Plan card on brand Settings (the card itself is the
// section's, see SettingsSection).
export function ProPlanCard({
  isPro,
  proSince,
  canPurchase,
}: {
  isPro: boolean;
  proSince: Date | null;
  // False in the iOS app — shows the current plan without any upgrade offer.
  canPurchase: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setPending(true);
    setError(null);
    const result = await createProCheckoutSessionAction().catch(() => ({
      error: "Couldn't reach the server. Check your connection and try again.",
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
          <p className="font-medium">Pro plan</p>
          <span className="whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-paper">Active</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {PRO_PLATFORM_FEE_RATE * 100}% platform fee instead of {PLATFORM_FEE_RATE * 100}%, for{" "}
          {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month.
          {proSince && (
            <>
              {" "}Pro since <LocalDate ms={proSince.getTime()} />.
            </>
          )}
        </p>
        <ConfirmActionButton
          action={cancelProAction}
          successMessage="Pro cancelled. You're back on the standard rate."
          title="Cancel Pro?"
          description={`Your fee goes back to ${PLATFORM_FEE_RATE * 100}% right away. The rest of this billing period isn't refunded.`}
          confirmLabel="Cancel Pro"
          pendingLabel="Cancelling…"
          className="self-start text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
        >
          Cancel Pro
        </ConfirmActionButton>
      </div>
    );
  }

  if (!canPurchase) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">Standard plan</p>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{PLATFORM_FEE_RATE * 100}% per payment</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          A {PLATFORM_FEE_RATE * 100}% platform fee is included in every payment you send.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">Standard plan</p>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{PLATFORM_FEE_RATE * 100}% per payment</span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Pay {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month to drop your platform fee from {PLATFORM_FEE_RATE * 100}%
        to {PRO_PLATFORM_FEE_RATE * 100}% on every payment. Worth it once you&apos;re paying creators more than about{" "}
        {formatCents(Math.round(PRO_SUBSCRIPTION_PRICE_CENTS / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE)))} a month.
      </p>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={pending}
        className="mt-1 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto sm:self-start"
      >
        {pending ? "Redirecting…" : `Go Pro for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month`}
      </button>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
