import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { adminTwoFactorRequired } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

// Every /admin page calls this itself, not just the admin layout: a layout
// doesn't re-render on client navigation and doesn't stop its pages from
// rendering (see Next's authentication guide, "Layouts and auth checks").
// cache() so the layout and the page share one session lookup per request.
// An admin without two-factor authentication is sent to switch it on first.
export const requireAdminSession = cache(async () => {
  const session = await auth();
  if (!session || !hasAdminAccess(session.user)) redirect("/login");
  if (adminTwoFactorRequired()) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { totpEnabled: true } });
    if (!user?.totpEnabled) redirect("/admin-security");
  }
  return session;
});
