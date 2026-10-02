import type { Role } from "@prisma/client";

// Who may open /admin: admin-only accounts (role ADMIN) and brands or
// creators who also have the isAdmin flag. Safe to import anywhere,
// including the proxy.
export function hasAdminAccess(user: { role: Role; isAdmin?: boolean | null }) {
  return user.role === "ADMIN" || user.isAdmin === true;
}
