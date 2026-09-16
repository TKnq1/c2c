"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateEmailVerificationAction } from "@/lib/actions/auth";

export function VerifyEmailLink() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateEmailVerificationAction().then((result) => {
      if (result?.verifyUrl) setUrl(result.verifyUrl);
      else if (result?.error) setError(result.error);
    });
  }, []);

  if (error) return <p className="text-sm text-ink">{error}</p>;
  if (!url) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Generating your verification link…</p>;

  return (
    <div className="rounded-lg border border-ink/10 p-3 text-sm flex flex-col gap-1">
      <p className="text-neutral-600 dark:text-neutral-400">
        This is a local prototype with no real email sending — here&apos;s your verification link
        directly:
      </p>
      <Link href={url} className="font-medium underline break-all">
        {url}
      </Link>
    </div>
  );
}
