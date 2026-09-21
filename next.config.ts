import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// 'unsafe-inline' on script-src is a deliberate, narrow tradeoff: the only
// inline script on the site is the small, self-authored theme-detection
// snippet in the root layout (no user input flows into it) — a real
// nonce-based CSP would remove this but needs per-request middleware
// wiring, out of scope here. Everything else stays locked to 'self'.
//
// 'unsafe-eval' is added in development only — Next/Turbopack's dev-mode
// HMR and React's dev-only debugging both use eval(), and React itself
// guarantees it never uses eval() in production, so this doesn't weaken
// the header that actually ships.
// https://*.stripe.com across script/frame/connect is Stripe's own documented
// minimum for any page using Stripe.js or embedded Connect components (see
// .agents/skills/stripe-best-practices/references/security.md) — the
// embedded Stripe Connect onboarding form (ConnectStripeButton) loads
// connect-js.stripe.com's script and renders Stripe's UI in nested iframes,
// both of which a narrower policy silently blocks with no visible error
// beyond the browser console.
// Only opened up when Sentry is actually configured (see .env.example) —
// an unconfigured deploy keeps the strictest possible connect-src.
const sentryConnectSrc = process.env.NEXT_PUBLIC_SENTRY_DSN ? " https://*.sentry.io" : "";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://*.stripe.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.stripe.com",
  "font-src 'self' data:",
  `connect-src 'self' https://*.stripe.com${sentryConnectSrc}${process.env.NODE_ENV === "development" ? " ws:" : ""}`,
  "frame-src https://*.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

// Wrapping is itself gated on the DSN — with no Sentry project configured,
// this build plugin shouldn't run at all (it would otherwise try to upload
// source maps to an org/project that doesn't exist).
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
    })
  : nextConfig;
