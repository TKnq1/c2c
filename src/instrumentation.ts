import * as Sentry from "@sentry/nextjs";

// Entirely inert until NEXT_PUBLIC_SENTRY_DSN is set (see .env.example) — no
// Sentry account is provisioned by this codebase, so nothing should try to
// talk to Sentry's servers until someone deliberately adds a real DSN.
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Safe to export unconditionally — captureRequestError is a no-op whenever
// Sentry.init() was never called above (DSN unset).
export const onRequestError = Sentry.captureRequestError;
