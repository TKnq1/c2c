import * as Sentry from "@sentry/nextjs";

// See src/instrumentation.ts — same "inert without a DSN" posture, just on
// the client side. No replay/feedback integrations: this is error capture
// only, kept deliberately narrow rather than turning on session recording
// nobody asked for (and that would need its own CSP + privacy review).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
