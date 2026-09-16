"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { NewPasswordField } from "@/components/new-password-field";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction.bind(null, token), undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <NewPasswordField name="password" label="New password" />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? "Saving…" : "Reset password"}
      </button>
    </form>
  );
}
