"use client";

import { useActionState, useState, useTransition } from "react";
import {
  startTwoFactorEnrollmentAction,
  confirmTwoFactorEnrollmentAction,
  disableTwoFactorAction,
} from "@/lib/actions/two-factor";
import { useI18n } from "@/components/i18n-provider";
import { localizeError } from "@/lib/i18n/labels";

export function TwoFactorSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const { t } = useI18n();
  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    confirmTwoFactorEnrollmentAction,
    undefined,
  );
  const [disableState, disableFormAction, disablePending] = useActionState(disableTwoFactorAction, undefined);

  const [acknowledged, setAcknowledged] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [enrollData, setEnrollData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [startError, setStartError] = useState<string | undefined>();
  const [askPassword, setAskPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingStart, startTransition] = useTransition();

  const isEnabled = disableState?.success ? false : confirmState?.success ? true : initialEnabled;

  if (confirmState?.success && confirmState.recoveryCodes && !acknowledged) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">{t("screens.settings.twoFactorOn")}</p>
        <div className="rounded bg-paper p-3">
          <p className="text-sm text-ink font-medium">{t("screens.settings.saveCodes")}</p>
          <p className="text-xs text-graphite mt-1">{t("screens.settings.saveCodesHint")}</p>
          <div className="grid grid-cols-2 gap-1.5 mt-3 font-mono text-sm">
            {confirmState.recoveryCodes.map((c) => (
              <span key={c} className="rounded-lg border border-ink/10 bg-paper px-2 py-1 text-center">
                {c}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAcknowledged(true)}
          className="self-start rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite"
        >
          {t("screens.settings.savedCodes")}
        </button>
      </div>
    );
  }

  if (isEnabled) {
    if (!showDisableForm) {
      return (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            <span className="text-ink font-medium">{t("screens.settings.enabled")}</span>. {t("screens.settings.twoFactorEnabled")}
          </p>
          <button
            type="button"
            onClick={() => setShowDisableForm(true)}
            className="text-xs text-neutral-400 hover:text-ink transition shrink-0 dark:text-neutral-500"
          >
            {t("screens.settings.disable")}
          </button>
        </div>
      );
    }
    return (
      <form action={disableFormAction} className="flex flex-col gap-2">
        <label htmlFor="disable2faPassword" className="text-sm font-medium">
          {t("screens.settings.disablePassword")}
        </label>
        <input
          id="disable2faPassword"
          name="password"
          type="password"
          required
          className="rounded border border-neutral-300 px-3 py-2.5 dark:border-neutral-700"
        />
        <label htmlFor="disable2faCode" className="text-sm font-medium mt-1">
          {t("screens.settings.enterCode")}
        </label>
        <input
          id="disable2faCode"
          name="code"
          type="text"
          inputMode="numeric"
          required
          maxLength={32}
          autoComplete="one-time-code"
          className="rounded border border-neutral-300 px-3 py-2.5 w-48 tracking-widest dark:border-neutral-700"
        />
        {disableState?.error && <p className="text-sm text-ink">{localizeError(disableState.error, t)}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={disablePending}
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
          >
            {disablePending ? t("screens.settings.disabling") : t("screens.settings.disable2fa")}
          </button>
          <button
            type="button"
            onClick={() => setShowDisableForm(false)}
            className="text-sm text-neutral-500 hover:text-neutral-800 transition dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    );
  }

  if (enrollData) {
    return (
      <form action={confirmFormAction} className="flex flex-col gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t("screens.settings.scanHint")}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrollData.qrDataUrl} alt={t("screens.settings.qrAlt")} className="w-40 h-40 self-start" />
        <p className="text-xs text-neutral-500 font-mono break-all dark:text-neutral-400">{enrollData.secret}</p>
        <div className="flex flex-col gap-1">
          <label htmlFor="totpCode" className="text-sm font-medium">
            {t("screens.settings.enterCode")}
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
            className="rounded border border-neutral-300 px-3 py-2.5 w-32 tracking-widest dark:border-neutral-700"
          />
        </div>
        {confirmState?.error && <p className="text-sm text-ink">{localizeError(confirmState.error, t)}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={confirmPending}
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
          >
            {confirmPending ? t("screens.settings.verifying") : t("screens.settings.confirm")}
          </button>
          <button
            type="button"
            onClick={() => setEnrollData(null)}
            className="text-sm text-neutral-500 hover:text-neutral-800 transition dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    );
  }

  function start() {
    setStartError(undefined);
    startTransition(async () => {
      const result = await startTwoFactorEnrollmentAction(password);
      setPassword("");
      if (result.error) setStartError(localizeError(result.error, t));
      else {
        setAskPassword(false);
        setEnrollData({ secret: result.secret!, qrDataUrl: result.qrDataUrl! });
      }
    });
  }

  // Switching it on asks for the password first (see startTwoFactorEnrollmentAction).
  if (askPassword) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
        className="flex flex-col gap-2"
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.settings.twoFactorHint")}</p>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("screens.settings.yourPassword")}
          aria-label={t("screens.settings.password")}
          className="rounded border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
        />
        {startError && <p className="text-sm text-ink">{startError}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pendingStart}
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
          >
            {pendingStart ? t("screens.settings.starting") : t("screens.settings.enable2fa")}
          </button>
          <button
            type="button"
            onClick={() => {
              setAskPassword(false);
              setPassword("");
              setStartError(undefined);
            }}
            className="text-sm text-neutral-500 hover:text-neutral-800 transition dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.settings.twoFactorHint")}</p>
        <button
          type="button"
          onClick={() => setAskPassword(true)}
          className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
        >
          {t("screens.settings.enable2fa")}
        </button>
      </div>
      {startError && <p className="text-sm text-ink">{startError}</p>}
    </div>
  );
}
