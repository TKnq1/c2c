"use client";

import { useActionState, useState, useTransition } from "react";
import {
  startTwoFactorEnrollmentAction,
  confirmTwoFactorEnrollmentAction,
  disableTwoFactorAction,
} from "@/lib/actions/two-factor";

export function TwoFactorSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    confirmTwoFactorEnrollmentAction,
    undefined,
  );
  const [disableState, disableFormAction, disablePending] = useActionState(disableTwoFactorAction, undefined);

  const [acknowledged, setAcknowledged] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [enrollData, setEnrollData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [startError, setStartError] = useState<string | undefined>();
  const [pendingStart, startTransition] = useTransition();

  const isEnabled = disableState?.success ? false : confirmState?.success ? true : initialEnabled;

  if (confirmState?.success && confirmState.recoveryCodes && !acknowledged) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">Two-factor authentication is now enabled.</p>
        <div className="rounded border border-ink/10 bg-fog p-3">
          <p className="text-sm text-ink font-medium">Save your recovery codes</p>
          <p className="text-xs text-graphite mt-1">
            Each code works once, if you ever lose access to your authenticator app. They won&apos;t be shown
            again.
          </p>
          <div className="grid grid-cols-2 gap-1.5 mt-3 font-mono text-sm">
            {confirmState.recoveryCodes.map((c) => (
              <span key={c} className="rounded bg-paper border border-ink/10 px-2 py-1 text-center">
                {c}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAcknowledged(true)}
          className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition self-start"
        >
          I&apos;ve saved these
        </button>
      </div>
    );
  }

  if (isEnabled) {
    if (!showDisableForm) {
      return (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            <span className="text-ink font-medium">Enabled</span> — an authenticator app is required at
            login.
          </p>
          <button
            type="button"
            onClick={() => setShowDisableForm(true)}
            className="text-xs text-neutral-400 hover:text-ink transition shrink-0 dark:text-neutral-500"
          >
            Disable
          </button>
        </div>
      );
    }
    return (
      <form action={disableFormAction} className="flex flex-col gap-2">
        <label htmlFor="disable2faPassword" className="text-sm font-medium">
          Enter your password to disable 2FA
        </label>
        <input
          id="disable2faPassword"
          name="password"
          type="password"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
        {disableState?.error && <p className="text-sm text-ink">{disableState.error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={disablePending}
            className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
          >
            {disablePending ? "Disabling…" : "Disable 2FA"}
          </button>
          <button
            type="button"
            onClick={() => setShowDisableForm(false)}
            className="text-sm text-neutral-500 hover:text-neutral-800 transition dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (enrollData) {
    return (
      <form action={confirmFormAction} className="flex flex-col gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Scan this with an authenticator app (Google Authenticator, Authy, 1Password, …), or enter the key
          manually.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrollData.qrDataUrl} alt="Two-factor authentication QR code" className="w-40 h-40 self-start" />
        <p className="text-xs text-neutral-500 font-mono break-all dark:text-neutral-400">{enrollData.secret}</p>
        <div className="flex flex-col gap-1">
          <label htmlFor="totpCode" className="text-sm font-medium">
            Enter the 6-digit code to confirm
          </label>
          <input
            id="totpCode"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            className="rounded-lg border border-neutral-300 px-3 py-2 w-32 tracking-widest dark:border-neutral-700"
          />
        </div>
        {confirmState?.error && <p className="text-sm text-ink">{confirmState.error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={confirmPending}
            className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
          >
            {confirmPending ? "Verifying…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setEnrollData(null)}
            className="text-sm text-neutral-500 hover:text-neutral-800 transition dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Add an authenticator app as a second step at login.</p>
        <button
          type="button"
          disabled={pendingStart}
          onClick={() => {
            setStartError(undefined);
            startTransition(async () => {
              const result = await startTwoFactorEnrollmentAction();
              if (result.error) setStartError(result.error);
              else setEnrollData({ secret: result.secret!, qrDataUrl: result.qrDataUrl! });
            });
          }}
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition disabled:opacity-50 shrink-0 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
        >
          {pendingStart ? "Starting…" : "Enable 2FA"}
        </button>
      </div>
      {startError && <p className="text-sm text-ink">{startError}</p>}
    </div>
  );
}
