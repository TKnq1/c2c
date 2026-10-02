// Whether a login has been logged out by a password change: the change came
// after the login began, and it wasn't this login that made it. A login with
// no recorded start counts as older than any change.
export function isSessionRevoked(
  login: { sid?: string; loginAt?: number },
  user: { sessionsRevokedAt: Date | null; keptSessionId: string | null },
): boolean {
  if (!user.sessionsRevokedAt) return false;
  if (login.sid && login.sid === user.keptSessionId) return false;
  return (login.loginAt ?? 0) < user.sessionsRevokedAt.getTime();
}
