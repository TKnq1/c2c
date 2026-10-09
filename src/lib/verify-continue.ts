import type { Role } from "@prisma/client";
import type { MessageKey } from "@/lib/i18n/translate";

// Where someone goes once their email is confirmed: a brand on to its first request, a creator to the feed.
export function verifyContinueTarget(role: Role | undefined): { href: string; label: MessageKey } {
  if (role === "STARTUP") return { href: "/dashboard/startup/new", label: "onboarding.done.postFirst" };
  if (role === "CREATOR") return { href: "/dashboard/creator", label: "onboarding.done.goFeed" };
  return { href: "/dashboard", label: "onboarding.done.goDashboard" };
}
