"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { loadConnectAndInitialize, type StripeConnectInstance } from "@stripe/connect-js";
import { ConnectComponentsProvider, ConnectAccountOnboarding } from "@stripe/react-connect-js";
import { createEmbeddedOnboardingSessionAction } from "@/lib/actions/stripe-connect";

// Embedded, not a redirect to a stripe.com page — see
// createEmbeddedOnboardingSessionAction. Reads the color scheme once at
// mount to roughly match the embed to our own light/dark palette; it won't
// live-update if the user flips the theme toggle mid-flow, which is a
// reasonable tradeoff against re-initializing Connect.js on every toggle.
function buildConnectInstance(): StripeConnectInstance {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return loadConnectAndInitialize({
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    fetchClientSecret: async () => {
      const result = await createEmbeddedOnboardingSessionAction();
      if ("error" in result) throw new Error(result.error);
      return result.clientSecret;
    },
    appearance: {
      variables: {
        colorPrimary: isDark ? "#ffffff" : "#070707",
        colorBackground: isDark ? "#070707" : "#ffffff",
        colorText: isDark ? "#ffffff" : "#070707",
        buttonPrimaryColorBackground: isDark ? "#ffffff" : "#070707",
        buttonPrimaryColorText: isDark ? "#070707" : "#ffffff",
        borderRadius: "8px",
        fontFamily: "var(--font-bentonsans), sans-serif",
      },
    },
  });
}

export function ConnectStripeButton({ isOnboarded }: { isOnboarded: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [connectInstance, setConnectInstance] = useState<StripeConnectInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setError("Stripe isn't configured yet (missing publishable key).");
      return;
    }
    try {
      setConnectInstance(buildConnectInstance());
      setOpen(true);
    } catch {
      setError("Couldn't start Stripe onboarding. Please try again.");
    }
  }, []);

  const handleExit = useCallback(() => {
    setOpen(false);
    // stripeOnboarded flips via the account.updated webhook, not
    // synchronously — refresh so a status change already processed by the
    // time the creator exits shows up without a manual reload.
    router.refresh();
  }, [router]);

  if (open && connectInstance) {
    return (
      <div className="rounded-2xl border border-ink/10 p-4">
        <ConnectComponentsProvider connectInstance={connectInstance}>
          <ConnectAccountOnboarding
            onExit={handleExit}
            onLoadError={() => setError("Couldn't load Stripe onboarding. Please try again.")}
          />
        </ConnectComponentsProvider>
        {error && <p className="text-sm text-ink mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleOpen}
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {isOnboarded ? "Update payout details" : "Connect Stripe to receive payouts"}
      </button>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
