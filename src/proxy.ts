import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Pre-launch gate — flip to false once setup is finished and the site is
// ready for real signups. While on, anyone without a session is confined
// to the gate page itself and the account-recovery flows (so the owner's
// own existing logins/resets keep working); everything else, signup
// included, redirects to "/" instead.
const GATE_ENABLED = true;
const GATE_ALLOWED_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  // Stripe's own servers, the keep-alive ping, and NextAuth's own
  // sign-in/session/csrf endpoints all need to keep working regardless.
  "/api/webhooks",
  "/api/health",
  "/api/auth",
  // Static/meta assets the gate page itself (and crawlers) need — anything
  // under /public bypasses _next/static's exclusion below, so these need
  // listing explicitly too.
  "/favicon.ico",
  "/icon",
  "/apple-icon",
  "/opengraph-image",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/logo.png",
  "/sw.js",
];

// Cheap, JWT-only redirect layer for UX routing. This is NOT the security
// boundary — every Server Action/Component re-checks the session and role
// independently before touching data.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (GATE_ENABLED && !req.auth && pathname !== "/" && !GATE_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const isAdminPath = pathname.startsWith("/admin");
  if (!pathname.startsWith("/dashboard") && !isAdminPath) return;

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = req.auth.user.role;

  if (isAdminPath) {
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/login", req.url));
    return;
  }

  // An admin has no brand/creator dashboard — send them to their own area
  // before the STARTUP/CREATOR checks below (which assume a binary role)
  // ever run.
  if (role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (pathname.startsWith("/dashboard/startup") && role !== "STARTUP") {
    return NextResponse.redirect(new URL("/dashboard/creator", req.url));
  }
  if (pathname.startsWith("/dashboard/creator") && role !== "CREATOR") {
    return NextResponse.redirect(new URL("/dashboard/startup", req.url));
  }
});

export const config = {
  // Broad while the gate is on, so it can catch everything public (signup,
  // discover pages, etc.) — not just /dashboard and /admin like before.
  // _next's own internals are the one thing that must stay excluded here;
  // everything else is filtered in the handler above instead of a bigger,
  // harder-to-read matcher regex.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
