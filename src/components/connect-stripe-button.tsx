"use client";

import { useState } from "react";
import { createConnectOnboardingLinkAction } from "@/lib/actions/stripe-connect";

export function ConnectStripeButton({ isOnboarded }: { isOnboarded: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const result = await createConnectOnboardingLinkAction();
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {pending ? "Redirecting…" : isOnboarded ? "Update payout details" : "Connect Stripe to receive payouts"}
      </button>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
