"use client";

import { useEffect, useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";
import { PRIMARY_BUTTON, SkipButton, StepHeading, stepActions, stepScreen } from "@/components/onboarding-ui";
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
export function OnboardingPushStep({ role, onDone, onSkip }: { role: "creator" | "brand"; onDone: () => void; onSkip: () => void }) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function turnOn() {
    setError(null);
    setPending(true);
    try {
      const result = isNativeApp() ? await enableNativePush() : await enableWebPush();
      if (result === "denied") {
        setError(t("onboarding.push.denied"));
        return;
      }
      toast.success(t("onboarding.push.on"));
      onDone();
    } catch {
      setError(t("onboarding.push.failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={stepScreen}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center sm:flex-none sm:py-4">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-fog">
          <IoNotificationsOutline className="h-9 w-9" aria-hidden />
        </span>
        <StepHeading
          align="center"
          title={role === "creator" ? t("onboarding.push.creatorTitle") : t("onboarding.push.brandTitle")}
          description={role === "creator" ? t("onboarding.push.creatorBody") : t("onboarding.push.brandBody")}
        />
      </div>
      {error && (
        <p role="alert" className="text-center text-sm text-ink">
          {error}
        </p>
      )}
      <div className={stepActions}>
        <button type="button" onClick={turnOn} disabled={pending} className={`${PRIMARY_BUTTON} w-full`}>
          {pending ? t("onboarding.push.turningOn") : t("onboarding.push.turnOn")}
        </button>
        <SkipButton onClick={error ? onDone : onSkip}>{error ? t("common.continue") : t("onboarding.push.notNow")}</SkipButton>
      </div>
    </div>
  );
}
