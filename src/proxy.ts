import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Pre-launch gate — flip to false once setup is finished and the site is
// ready for real signups. While on, EVERYTHING is off-limits — login and
// signup included — except the gate page itself and infrastructure that
// has to keep working regardless (Stripe's webhook calls, the keep-alive
// ping, NextAuth's own callback routes, static/meta assets). The only way
// in is GATE_BYPASS_SECRET, set as an env var and known only to the owner:
// visiting "/?gate=<secret>" once sets a long-lived cookie that clears the
// gate for that browser from then on — it does not log anyone in, it just
// gets them past this check to the real login page.
const GATE_ENABLED = true;
const GATE_BYPASS_COOKIE = "gate_bypass";
const GATE_BYPASS_SECRET = process.env.GATE_BYPASS_SECRET;

const GATE_INFRA_PREFIXES = [
  "/api/webhooks",
  "/api/health",
  "/api/auth",
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
  const isInfra = GATE_INFRA_PREFIXES.some((p) => pathname.startsWith(p));

  if (GATE_ENABLED && !isInfra) {
    const bypassParam = req.nextUrl.searchParams.get("gate");
    const cookieMatches = !!GATE_BYPASS_SECRET && req.cookies.get(GATE_BYPASS_COOKIE)?.value === GATE_BYPASS_SECRET;
    const paramMatches = !!GATE_BYPASS_SECRET && bypassParam === GATE_BYPASS_SECRET;
    const bypassed = !!req.auth || cookieMatches || paramMatches;

    if (!bypassed && pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // First hit with the secret in the URL — persist it as a cookie so the
    // owner doesn't need "?gate=..." on every link from here on.
    if (paramMatches && !cookieMatches) {
      const res = NextResponse.next();
      res.cookies.set(GATE_BYPASS_COOKIE, GATE_BYPASS_SECRET!, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }
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
  // Broad while the gate is on, so it can catch everything public (login,
  // signup, discover pages, etc.) — not just /dashboard and /admin like
  // before. _next's own internals are the one thing that must stay
  // excluded here; everything else is filtered in the handler above
  // instead of a bigger, harder-to-read matcher regex.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
