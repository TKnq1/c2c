"use client";

import { useState, useTransition } from "react";
import { sendTestEmailAction } from "@/lib/actions/admin";
import { errorMessage } from "@/lib/error-message";

type Result = Awaited<ReturnType<typeof sendTestEmailAction>>;

// Sends the test email and shows the answer in place: the email service's
// own error message is what an admin needs to fix a setup problem.
export function SendTestEmailButton({ to }: { to: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await sendTestEmailAction());
      } catch (err) {
        setResult({ error: errorMessage(err) });
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={send}
        disabled={pending}
        className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:w-auto sm:self-start"
      >
        {pending ? "Sending…" : `Send a test email to ${to}`}
      </button>
      {result?.error && (
        <p role="alert" className="rounded bg-fog px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Not sent.</span> {result.error}
        </p>
      )}
      {result && !result.error && (
        <p role="status" className="rounded bg-fog px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Sent to {result.to}.</span> The email service took it (id {result.id}). It
          should be in the inbox within a minute. Not there? Look in spam, then in Resend under Emails, which shows
          what happened to it.
        </p>
      )}
    </div>
  );
}
