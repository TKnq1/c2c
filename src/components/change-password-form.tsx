"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { useActionToast } from "@/lib/use-action-toast";
import { NewPasswordField } from "@/components/new-password-field";
import { useNavigationBlocker } from "@/lib/navigation-blocker";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, "Password changed.");
  const { setIsBlocked } = useNavigationBlocker();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      queueMicrotask(() => setIsBlocked(false));
    }
  }, [state, setIsBlocked]);

  return (
    <form ref={formRef} action={formAction} onChange={() => setIsBlocked(true)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-sm font-medium">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <NewPasswordField key={state?.success ? "done" : "editing"} name="newPassword" label="New password" />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
