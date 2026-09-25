"use client";

import { useActionState, useState } from "react";
import type { Role } from "@prisma/client";
import { signupAction } from "@/lib/actions/auth";
import { NewPasswordField } from "@/components/new-password-field";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, RELEASE_REVIEW_DAYS } from "@/lib/constants";

// Only the two self-serve signup roles — admins aren't created through this form.
export type SignupRole = Extract<Role, "STARTUP" | "CREATOR">;

const FEE_NOTE: Record<SignupRole, string> = {
  STARTUP: `You pay exactly what you offer, held in escrow until the work is live and you've approved it — we take ${PLATFORM_FEE_RATE * 100}% from the creator's payout, ${PRO_PLATFORM_FEE_RATE * 100}% with Pro.`,
  CREATOR: `Keep ${100 - PLATFORM_FEE_RATE * 100}% of every deal, ${100 - PRO_PLATFORM_FEE_RATE * 100}% when the brand's on Pro — paid out once the brand approves your post, or automatically after ${RELEASE_REVIEW_DAYS} days.`,
};

type Props = {
  // Uncontrolled by default (own toggle, own state) — the standalone
  // /signup page uses it this way. The homepage passes both so the same
  // Brand/Creator choice also drives what's shown on its left column.
  role?: SignupRole;
  onRoleChange?: (role: SignupRole) => void;
};

// Just email/password/role — company name, or display name/niche/platforms,
// are collected right after by the /onboarding wizard, one field at a time,
// so the bar to actually creating an account stays low.
export function SignupForm({ role: controlledRole, onRoleChange }: Props = {}) {
  const [internalRole, setInternalRole] = useState<SignupRole>("STARTUP");
  const role = controlledRole ?? internalRole;
  const setRole = onRoleChange ?? setInternalRole;
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded bg-fog p-1">
        <button
          type="button"
          onClick={() => setRole("STARTUP")}
          className={`rounded py-2 text-sm font-medium transition ${
            role === "STARTUP" ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          I&apos;m a Brand
        </button>
        <button
          type="button"
          onClick={() => setRole("CREATOR")}
          className={`rounded py-2 text-sm font-medium transition ${
            role === "CREATOR" ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          I&apos;m a Creator
        </button>
      </div>
      <input type="hidden" name="role" value={role} />
      <p className="text-xs text-neutral-400 dark:text-neutral-500">{FEE_NOTE[role]}</p>

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
      <NewPasswordField name="password" />

      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
