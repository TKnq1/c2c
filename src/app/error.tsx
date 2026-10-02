"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Logo } from "@/components/logo";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <Logo large />
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Error</p>
          <h1 className="font-display text-title-1 font-bold mt-1">Something went wrong</h1>
          <p className="text-sm text-neutral-600 mt-2 dark:text-neutral-400">
            An unexpected error occurred. You can try again, or head back to your dashboard.
          </p>
          {/* What the server log has this error under (Vercel logs, search
              for it), so a report can be traced to the real cause. */}
          {error.digest && (
            <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">Reference: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => retry()}
            className="rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:bg-graphite transition"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
