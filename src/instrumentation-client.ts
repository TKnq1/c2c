import { captureRouterTransition, watchForClientErrors } from "@/lib/sentry-client";

// See src/instrumentation.ts — same "inert without a DSN" posture, just on the client side.
// The SDK itself is not part of the page: it loads when the first error happens (see sentry-client.ts).
watchForClientErrors();

export const onRouterTransitionStart = captureRouterTransition;
