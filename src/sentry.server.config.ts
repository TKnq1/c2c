import * as Sentry from "@sentry/nextjs";

// Only ever imported by instrumentation.ts's register(), which already
// checked NEXT_PUBLIC_SENTRY_DSN is set before importing this file.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Error capture doesn't need this — it's for performance traces, which
  // nobody asked for here. Raise it later if performance monitoring becomes
  // useful; 0 keeps this strictly about errors for now.
  tracesSampleRate: 0,
});
