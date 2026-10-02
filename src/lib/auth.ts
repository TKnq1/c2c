import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { verifyTotpCode } from "@/lib/totp";
import { verifyAndConsumeRecoveryCode } from "@/lib/recovery-codes";
import { isRateLimited, logLoginAttempt } from "@/lib/login-security";
import { isSessionRevoked } from "@/lib/session-revocation";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // A year, and every visit starts the year over: people stay logged in for
  // as long as they use comtor at all. Changing the password logs out every
  // other device (sessionsRevokedAt, below), so a lost phone doesn't stay
  // in for a year.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 365 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Code", type: "text" },
      },
      // This is the one gate NextAuth always calls for a credentials
      // sign-in, no matter which client action triggered it — so rate
      // limiting, the password check, and the 2FA check are all
      // independently re-verified here too, not just in checkLoginAction's
      // nicer pre-flight UX check.
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const code = typeof credentials?.code === "string" ? credentials.code : "";

        if (await isRateLimited(email)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await logLoginAttempt({ email, succeeded: false });
          return null;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          await logLoginAttempt({ email, succeeded: false, userId: user.id });
          return null;
        }

        if (user.totpEnabled) {
          const validCode =
            (user.totpSecret ? verifyTotpCode(user.totpSecret, code) : false) ||
            (await verifyAndConsumeRecoveryCode(user.id, code));
          if (!validCode) {
            await logLoginAttempt({ email, succeeded: false, userId: user.id });
            return null;
          }
        }

        await logLoginAttempt({ email, succeeded: true, userId: user.id });
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.checkedAt = Date.now();
        token.sid = crypto.randomUUID();
        token.loginAt = Date.now();
        return token;
      }
      // Logins from before sessions had an id get one on their next request.
      if (typeof token.sid !== "string") {
        token.sid = crypto.randomUUID();
        token.loginAt = Date.now();
      }
      // A JWT stays cryptographically valid even after its user row is
      // gone (e.g. a local reseed replaces every user with a fresh id) —
      // without this check, every page would eventually crash trying to
      // load a profile that no longer exists instead of just redirecting
      // to login. But `auth()` runs on every request, and this callback
      // with it — re-querying every single time defeats the entire point
      // of the JWT strategy (no DB round-trip to read a session) and was
      // measured adding ~1.2s to every page load. Re-checking every 5
      // minutes instead keeps the same guarantee (a stale JWT is still
      // caught, just not instantly) at a fraction of the DB cost.
      const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (Date.now() - checkedAt < 5 * 60 * 1000) return token;

      // A thrown error here (Neon's serverless compute waking from
      // autosuspend after 5+ idle minutes — see /api/health — is slow
      // enough to occasionally time out) is not the same thing as a
      // confirmed-absent user, but was being treated as one: any error
      // out of findUnique propagated out of this callback and invalidated
      // the session just like a genuine `stillExists === null` would,
      // logging someone out over a connectivity blip. Only an actual
      // "row not found" result should log anyone out; a query failure
      // just leaves checkedAt alone so this retries on the next request
      // instead of waiting out the full 5 minutes again.
      try {
        const current = await prisma.user.findUnique({
          where: { id: token.id },
          select: { sessionsRevokedAt: true, keptSessionId: true },
        });
        if (!current) return null;
        // The password was changed after this login began, somewhere else.
        // Nothing here trusts the session update endpoint, so a copied
        // cookie can't refresh itself back in.
        if (isSessionRevoked(token, current)) return null;
        token.checkedAt = Date.now();
      } catch {
        // Fall through and return the token below, checkedAt untouched.
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.sid = token.sid ?? "";
      return session;
    },
  },
});
