import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { verifyTotpCode } from "@/lib/totp";
import { verifyAndConsumeRecoveryCode } from "@/lib/recovery-codes";
import { isRateLimited, logLoginAttempt } from "@/lib/login-security";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
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
        return token;
      }
      // A JWT stays cryptographically valid even after its user row is
      // gone (e.g. a local reseed replaces every user with a fresh id) —
      // without this check, every page would crash trying to load a
      // profile that no longer exists instead of just redirecting to
      // login. Returning null here clears the session.
      const stillExists = await prisma.user.findUnique({ where: { id: token.id }, select: { id: true } });
      if (!stillExists) return null;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
