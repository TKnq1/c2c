type SentryModule = typeof import("@sentry/nextjs");

let loading: Promise<SentryModule> | null = null;
let loaded: SentryModule | null = null;
let stopWatching: (() => void) | null = null;

// The SDK is a large chunk that only matters once something goes wrong, so it is fetched at the first
// error instead of with every page view. No replay/feedback integrations: error capture only, kept
// deliberately narrow rather than turning on session recording nobody asked for (and that would need
// its own CSP + privacy review).
function loadSentry(): Promise<SentryModule> {
  loading ??= import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0 });
    loaded = Sentry;
    // From here on the SDK's own handlers see every error; keeping ours would report each one twice.
    stopWatching?.();
    return Sentry;
  });
  return loading;
}

// Inert without a DSN, same as the server side (see src/instrumentation.ts).
export function captureClientError(error: unknown): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  loadSentry()
    .then((Sentry) => Sentry.captureException(error))
    .catch(() => {
      // The chunk could not be fetched (offline): nothing left to report with.
    });
}

// Started before the first paint (see instrumentation-client.ts). An error that happens before the SDK
// is loaded is what loads it, and is reported once it is up.
export function watchForClientErrors(): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const onError = (event: ErrorEvent) => captureClientError(event.error ?? new Error(event.message));
  const onRejection = (event: PromiseRejectionEvent) => captureClientError(event.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  stopWatching = () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

export function captureRouterTransition(href: string, navigationType: string): void {
  loaded?.captureRouterTransitionStart(href, navigationType);
}
