"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { checkLoginAction, completeLoginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const [checkState, checkFormAction, checkPending] = useActionState(checkLoginAction, undefined);
  const [completeState, completeFormAction, completePending] = useActionState(completeLoginAction, undefined);

  // Password is never sent back from the server — the client already has
  // what it just typed, so step 2 just carries that forward as hidden
  // fields alongside the code. Calling the useActionState dispatcher
  // outside of a <form action> needs an explicit transition, or its
  // pending state doesn't track correctly.
  useEffect(() => {
    if (checkState?.proceed && credentials) {
      const formData = new FormData();
      formData.set("email", credentials.email);
      formData.set("password", credentials.password);
      formData.set("code", "");
      formData.set("role", checkState.role ?? "");
      startTransition(() => completeFormAction(formData));
    }
  }, [checkState, credentials, completeFormAction]);

  if (checkState?.requiresTwoFactor && credentials) {
    return (
      <form action={completeFormAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={credentials.email} />
        <input type="hidden" name="password" value={credentials.password} />
        <input type="hidden" name="role" value={checkState.role ?? ""} />
        <div className="flex flex-col gap-1">
          <label htmlFor="code" className="text-sm font-medium">
            {useRecoveryCode ? "Recovery code" : "Authentication code"}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            autoFocus
            autoComplete="one-time-code"
            placeholder={useRecoveryCode ? "XXXXX-XXXXX" : "123456"}
            className="rounded-lg border border-neutral-300 px-3 py-2 tracking-widest dark:border-neutral-700"
          />
        </div>
        <button
          type="button"
          onClick={() => setUseRecoveryCode((v) => !v)}
          className="text-xs text-neutral-500 underline self-start dark:text-neutral-400"
        >
          {useRecoveryCode ? "Use authentication code instead" : "Use a recovery code instead"}
        </button>
        {completeState?.error && <p className="text-sm text-ink">{completeState.error}</p>}
        <button
          type="submit"
          disabled={completePending}
          className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
        >
          {completePending ? "Verifying…" : "Verify"}
        </button>
      </form>
    );
  }

  return (
    <form
      action={(formData) => {
        setCredentials({ email: String(formData.get("email")), password: String(formData.get("password")) });
        checkFormAction(formData);
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      {(checkState?.error || completeState?.error) && (
        <p className="text-sm text-ink">{checkState?.error ?? completeState?.error}</p>
      )}
      <button
        type="submit"
        disabled={checkPending || completePending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {checkPending || completePending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
