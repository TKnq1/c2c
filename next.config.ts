import type { NextConfig } from "next";

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
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${process.env.NODE_ENV === "development" ? " ws:" : ""}`,
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

export default nextConfig;
