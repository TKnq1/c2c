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

const isDev = process.env.NODE_ENV === "development";

// Clickjacking protection (frame-ancestors/X-Frame-Options) stays maximally
// strict ('none'/DENY) in production. Both this and frame-src (which
// controls what THIS app may embed, not just what may embed it) are
// loosened to same-origin-only in development so the /dev-phone-frame
// preview tool (a same-origin iframe of the app, for reviewing pages
// without resizing the browser) isn't blocked by the app framing itself —
// still blocks any third-party site from framing it either way.
const frameAncestors = isDev ? "'self'" : "'none'";
const frameSrc = `https://*.stripe.com${isDev ? " 'self'" : ""}`;

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://*.stripe.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.stripe.com",
  "font-src 'self' data:",
  // blob: is the admin dashboard's morning song, played from a file kept in the browser (see src/lib/admin-song.ts).
  "media-src 'self' blob:",
  `connect-src 'self' https://*.stripe.com${sentryConnectSrc}${isDev ? " ws:" : ""}`,
  `frame-src ${frameSrc}`,
  `frame-ancestors ${frameAncestors}`,
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // (Not in development: plain http://localhost would be rewritten to https.)
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // The brand-deals switch (src/lib/deals/flag.ts), readable in client components like the navigation.
  env: { NEXT_PUBLIC_BRAND_DEALS_ENABLED: process.env.BRAND_DEALS_ENABLED ?? "" },
  // Local dev only: the Next.js badge sat on top of the sidebar's account
  // button in the bottom-left corner.
  devIndicators: { position: "bottom-right" },
  // The only two qualities the app asks the image optimizer for (see cardPhoto).
  images: { qualities: [60, 75] },
  experimental: {
    serverActions: {
      // A new request can carry up to five photos (resized to a few hundred
      // KB each in the browser). Vercel caps a function's body at 4.5 MB
      // regardless, so this only lifts Next's own 1 MB default up to that.
      bodySizeLimit: "4.5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: isDev ? "SAMEORIGIN" : "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // camera and payment stay unset: Stripe's embedded onboarding (identity check) needs the camera
          // inside its own frame, and a policy that names them would block handing it over.
          { key: "Permissions-Policy", value: "microphone=(), geolocation=(), usb=(), bluetooth=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
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
