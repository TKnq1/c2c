import type { Role } from "@prisma/client";

// Only the two self-serve signup roles — admins aren't created through the
// sign-up form.
export type SignupRole = Extract<Role, "STARTUP" | "CREATOR">;

// What /signup's ?role= says: the side of the landing page the visitor was
// looking at ("creator" or "brand"; the plural of either too, as the landing
// page's own ?for= takes). Anything else leaves the choice to the visitor,
// because an account's role can't be changed afterwards.
export function parseSignupRole(value: string | string[] | undefined): SignupRole | null {
  const side = (Array.isArray(value) ? value[0] : value)?.toLowerCase();
  if (side === "creator" || side === "creators") return "CREATOR";
  if (side === "brand" || side === "brands") return "STARTUP";
  return null;
}
