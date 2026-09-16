import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Cheap, JWT-only redirect layer for UX routing. This is NOT the security
// boundary — every Server Action/Component re-checks the session and role
// independently before touching data.
export default auth((req) => {
  const { pathname } = req.nextUrl;
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
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
