"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

const STRENGTH_KEYS: MessageKey[] = [
  "screens.strength.veryWeak",
  "screens.strength.weak",
  "screens.strength.fair",
  "screens.strength.good",
  "screens.strength.strong",
  "screens.strength.veryStrong",
];

function getStrength(pw: string): { score: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  return { score };
}

// A password input paired with a client-only confirm field: strength meter
// and match check are pure UX — the confirm value is never submitted (no
// `name`), so the server's schema and validation are untouched.
export function NewPasswordField({ name, label }: { name: string; label?: string }) {
  const { t } = useI18n();
  const fieldLabel = label ?? t("screens.auth.password");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const confirmRef = useRef<HTMLInputElement>(null);
  const fieldId = name;
  const strength = getStrength(password);
  const showMatch = confirm.length > 0;
  const matches = password === confirm;

  useEffect(() => {
    confirmRef.current?.setCustomValidity(showMatch && !matches ? t("screens.settings.passwordsDont") : "");
  }, [showMatch, matches, t]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {fieldLabel}
      </label>
      <input
        id={fieldId}
        name={name}
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded border border-neutral-300 px-3 py-2.5 dark:border-neutral-700"
      />
      {password.length > 0 && (
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strength.score ? "bg-ink" : "bg-fog"}`} />
            ))}
          </div>
          <span className="text-xs text-stone shrink-0">{t(STRENGTH_KEYS[Math.min(strength.score, STRENGTH_KEYS.length - 1)])}</span>
        </div>
      )}

      <label htmlFor={`${fieldId}-confirm`} className="text-sm font-medium mt-2">
        {t("screens.settings.confirmPassword", { label: fieldLabel })}
      </label>
      <input
        ref={confirmRef}
        id={`${fieldId}-confirm`}
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={`rounded border px-3 py-2.5 ${showMatch && !matches ? "border-ink" : "border-neutral-300 dark:border-neutral-700"}`}
      />
      {showMatch && (
        <p className={`text-xs ${matches ? "text-stone" : "text-ink font-medium"}`}>
          {matches ? t("screens.settings.passwordsMatch") : t("screens.settings.passwordsDont")}
        </p>
      )}
    </div>
  );
}
