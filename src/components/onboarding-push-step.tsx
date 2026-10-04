"use client";

import { useEffect, useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { PRIMARY_BUTTON, SkipButton, StepHeading } from "@/components/onboarding-ui";
import { enableNativePush, isNativeApp, nativePushPermission } from "@/lib/native-push-client";
import { browserSupportsWebPush, currentWebPushSubscription, enableWebPush } from "@/lib/web-push-client";
import { toast } from "@/lib/toast";

// Only worth a step if turning notifications on can work, and hasn't been
// decided already: the store apps that haven't been asked, or a browser
// that supports Web Push, has the VAPID key configured, and where the
// permission is still undecided. Settled on the client after mount, so the
// step is simply left out until (and unless) this says yes.
export function usePushOffer(): boolean {
  const [offer, setOffer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        if (isNativeApp()) {
          const permission = await nativePushPermission();
          return permission === "prompt" || permission === "prompt-with-rationale";
        }
        if (!browserSupportsWebPush() || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return false;
        if (Notification.permission !== "default") return false;
        return !(await currentWebPushSubscription());
      } catch {
        return false;
      }
    }
    check().then((yes) => {
      if (!cancelled) setOffer(yes);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return offer;
}

// Asked at the end, after the person has seen what the app is for, and with
// a reason in their own terms. The browser's or phone's permission prompt
// only opens from the button.
export function OnboardingPushStep({
  role,
  onDone,
  onSkip,
}: {
  role: "creator" | "brand";
  onDone: () => void;
  onSkip: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function turnOn() {
    setError(null);
    setPending(true);
    try {
      const result = isNativeApp() ? await enableNativePush() : await enableWebPush();
      if (result === "denied") {
        setError("Notifications are off for comtor. You can turn them on later in Settings.");
        return;
      }
      toast.success("Notifications are on.");
      onDone();
    } catch {
      setError("Couldn't turn notifications on. You can try again in Settings.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fog">
        <IoNotificationsOutline className="h-7 w-7" aria-hidden />
      </span>
      <StepHeading
        title={role === "creator" ? "Know the moment a brand replies" : "Know the moment a creator replies"}
        description={
          role === "creator"
            ? "Turn on notifications and we'll tell you about new matches, replies and payments, even when the app is closed."
            : "Turn on notifications and we'll tell you about replies, interested creators and payments, even when the app is closed."
        }
      />
      {error && (
        <p role="alert" className="text-sm text-ink">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button type="button" onClick={turnOn} disabled={pending} className={PRIMARY_BUTTON}>
          {pending ? "Turning on…" : "Turn on notifications"}
        </button>
        <SkipButton onClick={error ? onDone : onSkip}>{error ? "Continue" : "Not now"}</SkipButton>
      </div>
    </div>
  );
}
