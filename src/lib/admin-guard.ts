import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { MINUTE, takeToken } from "@/lib/rate-limit";

// Admin actions delete accounts, move money and mail people, so they don't rely on the session
// token's copy of "is admin" (re-read from the database only every few minutes, and kept as it was
// when that read fails): the account is looked up now. Admins also need two-factor authentication
// (REQUIRE_ADMIN_2FA=0 switches that off).
export function adminTwoFactorRequired() {
  return process.env.REQUIRE_ADMIN_2FA !== "0";
}

export async function requireAdmin() {
  const session = await auth();
  if (!session || !hasAdminAccess(session.user)) return null;
  const fresh = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isAdmin: true, suspendedAt: true, totpEnabled: true },
  });
  if (!fresh || fresh.suspendedAt || !hasAdminAccess(fresh)) return null;
  if (adminTwoFactorRequired() && !fresh.totpEnabled) return null;
  return session;
}

// Money moves and deletions ask for the password again, so a session someone walked away from
// can't be used for them. Returns an error message, or null when the password is right.
export async function confirmAdminPassword(userId: string, password: unknown): Promise<string | null> {
  if (typeof password !== "string" || password.length === 0 || password.length > 256) return "Enter your password to confirm.";
  if (!(await takeToken("password-check", userId, 5, 15 * MINUTE))) return "Too many attempts. Try again in 15 minutes.";
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  return (await verifyPassword(user, password)) ? null : "Incorrect password.";
}
