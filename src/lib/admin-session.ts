import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Every /admin page calls this itself, not just the admin layout: a layout
// doesn't re-render on client navigation and doesn't stop its pages from
// rendering (see Next's authentication guide, "Layouts and auth checks").
// cache() so the layout and the page share one session lookup per request.
export const requireAdminSession = cache(async () => {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");
  return session;
});
