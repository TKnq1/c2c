"use client";

import { useEffect, useState } from "react";
import { generateEmailVerificationAction } from "@/lib/actions/auth";

export function VerifyEmailLink() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateEmailVerificationAction().then((result) => {
      if (result?.sent) setSent(true);
      else if (result?.error) setError(result.error);
    });
  }, []);

  if (error) return <p className="text-sm text-ink">{error}</p>;
  if (!sent) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Sending your verification email…</p>;

  return (
    <p className="text-sm text-neutral-700 dark:text-neutral-300">
      Verification email sent — check your inbox and click the link there.
    </p>
  );
}
