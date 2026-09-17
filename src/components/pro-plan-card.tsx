"use client";

import { useState } from "react";
import { createProCheckoutSessionAction, cancelProAction } from "@/lib/actions/subscription";
import { ActionButton } from "@/components/action-button";
import { formatCents } from "@/lib/format";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";

export function ProPlanCard({ isPro, proSince }: { isPro: boolean; proSince: Date | null }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setPending(true);
    setError(null);
    const result = await createProCheckoutSessionAction();
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.href = result.url;
  }

  if (isPro) {
    return (
      <div className="rounded-2xl border border-ink/10 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">Pro plan</p>
          <span className="text-xs rounded bg-ink text-paper px-3 py-1 whitespace-nowrap font-medium">Active</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {PRO_PLATFORM_FEE_RATE * 100}% platform fee instead of {PLATFORM_FEE_RATE * 100}%, for{" "}
          {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month.
          {proSince && ` Pro since ${proSince.toLocaleDateString("en-US")}.`}
        </p>
        <ActionButton
          action={cancelProAction}
          successMessage="Pro cancelled — back to the standard rate."
          confirmMessage="Cancel your Pro subscription? This takes effect immediately — the rest of this billing period isn't refunded."
          className="text-sm text-neutral-500 hover:text-ink transition disabled:opacity-50 self-start"
        >
          Cancel Pro
        </ActionButton>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">Standard plan</p>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{PLATFORM_FEE_RATE * 100}% per offer</span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Pay {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month to drop your platform fee from{" "}
        {PLATFORM_FEE_RATE * 100}% to {PRO_PLATFORM_FEE_RATE * 100}% on every offer. Worth it once
        you&apos;re sending more than ~
        {formatCents(Math.round(PRO_SUBSCRIPTION_PRICE_CENTS / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE)))}{" "}
        /month in offers.
      </p>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {pending ? "Redirecting…" : `Subscribe to Pro — ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month`}
      </button>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
