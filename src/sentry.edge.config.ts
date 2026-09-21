import * as Sentry from "@sentry/nextjs";

// Only ever imported by instrumentation.ts's register(), which already
// checked NEXT_PUBLIC_SENTRY_DSN is set before importing this file. Separate
// from sentry.server.config.ts because the edge runtime (proxy.ts) can't use
// the Node SDK — same split Next.js itself uses for instrumentation.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
});
