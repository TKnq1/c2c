"use client";

import { useState } from "react";
import { subscribeToProAction, cancelProAction } from "@/lib/actions/subscription";
import { ActionButton } from "@/components/action-button";
import { formatCents } from "@/lib/format";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";

// Keyed by isPro at the call site (see settings page) so this remounts
// fresh on every plan change — otherwise showCheckout could survive a
// subscribe and show a stale checkout screen after a later cancel.
export function ProPlanCard({ isPro, proSince }: { isPro: boolean; proSince: Date | null }) {
  const [showCheckout, setShowCheckout] = useState(false);

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
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Simulated subscription — no real recurring charge happens (that needs real payment
          processing). The discounted fee itself is fully real and applies to every offer you
          send while active.
        </p>
        <ActionButton
          action={cancelProAction}
          successMessage="Pro cancelled — back to the standard rate."
          className="text-sm text-neutral-500 hover:text-ink transition disabled:opacity-50 self-start"
        >
          Cancel Pro
        </ActionButton>
      </div>
    );
  }

  // The actual "pay to unlock the lower rate" moment — a distinct checkout
  // step rather than the subscribe button firing immediately, same shape
  // as the offer/deposit forms elsewhere (reveal, then confirm).
  if (showCheckout) {
    return (
      <div className="rounded-2xl border border-ink p-4 flex flex-col gap-3">
        <p className="font-medium">Confirm your subscription</p>
        <div className="rounded border border-ink/10 bg-fog p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm">Pro plan</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Billed monthly · cancel anytime</p>
          </div>
          <p className="font-display text-2xl font-normal shrink-0">
            {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}
            <span className="text-sm text-neutral-500 dark:text-neutral-400">/mo</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Payment method</p>
          <div className="rounded border border-ink/10 p-3 flex items-center gap-3">
            <div
              aria-hidden
              className="h-7 w-11 rounded bg-ink text-paper flex items-center justify-center text-[9px] font-semibold tracking-wide shrink-0"
            >
              DEMO
            </div>
            <div className="min-w-0">
              <p className="text-sm">Demo card •••• 4242</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Fake placeholder — no real card is on file or gets charged.
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Simulated checkout — no real payment processor is connected and the card above isn&apos;t
          real. Confirming below flips your platform fee to {PRO_PLATFORM_FEE_RATE * 100}% immediately,
          same as it would the moment a real charge succeeded.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <ActionButton
            action={subscribeToProAction}
            successMessage="You're on Pro now — 3% fee from here on."
            className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            Confirm — {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month
          </ActionButton>
          <button
            type="button"
            onClick={() => setShowCheckout(false)}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100 shrink-0"
          >
            Cancel
          </button>
        </div>
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
        onClick={() => setShowCheckout(true)}
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition self-start"
      >
        Subscribe to Pro — {formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month
      </button>
    </div>
  );
}
