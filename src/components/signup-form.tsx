"use client";

import { useActionState, useState } from "react";
import type { Role } from "@prisma/client";
import { signupAction } from "@/lib/actions/auth";
import { NICHES } from "@/lib/constants";
import { PlatformPicker } from "@/components/platform-picker";
import { Select } from "@/components/select";
import { NewPasswordField } from "@/components/new-password-field";

export function SignupForm() {
  const [role, setRole] = useState<Role>("STARTUP");
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

      {role === "STARTUP" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="companyName" className="text-sm font-medium">
            Company name
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="niche" className="text-sm font-medium">
              Niche
            </label>
            <Select id="niche" name="niche" required>
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Platforms &amp; followers</span>
            <PlatformPicker name="platforms" />
          </div>
        </>
      )}

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
