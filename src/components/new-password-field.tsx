"use client";

import { useEffect, useRef, useState } from "react";

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"];

function getStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  return { score, label: STRENGTH_LABELS[Math.min(score, STRENGTH_LABELS.length - 1)] };
}

// A password input paired with a client-only confirm field: strength meter
// and match check are pure UX — the confirm value is never submitted (no
// `name`), so the server's schema and validation are untouched.
export function NewPasswordField({ name, label = "Password" }: { name: string; label?: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const confirmRef = useRef<HTMLInputElement>(null);
  const fieldId = name;
  const strength = getStrength(password);
  const showMatch = confirm.length > 0;
  const matches = password === confirm;

  useEffect(() => {
    confirmRef.current?.setCustomValidity(showMatch && !matches ? "Passwords don't match." : "");
  }, [showMatch, matches]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
      />
      {password.length > 0 && (
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded ${i < strength.score ? "bg-ink" : "bg-fog"}`} />
            ))}
          </div>
          <span className="text-xs text-stone shrink-0">{strength.label}</span>
        </div>
      )}

      <label htmlFor={`${fieldId}-confirm`} className="text-sm font-medium mt-2">
        Confirm {label.toLowerCase()}
      </label>
      <input
        ref={confirmRef}
        id={`${fieldId}-confirm`}
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={`rounded border px-3 py-2 ${showMatch && !matches ? "border-ink" : "border-neutral-300 dark:border-neutral-700"}`}
      />
      {showMatch && (
        <p className={`text-xs ${matches ? "text-stone" : "text-ink font-medium"}`}>
          {matches ? "Passwords match." : "Passwords don't match."}
        </p>
      )}
    </div>
  );
}
