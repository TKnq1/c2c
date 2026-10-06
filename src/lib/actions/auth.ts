"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { AuthError } from "next-auth";
import type { Role } from "@prisma/client";
import { signIn, signOut, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isRateLimited,
  logLoginAttempt,
  RATE_LIMIT_MESSAGE,
  isPasswordResetRateLimited,
  isSignupRateLimited,
  logSignupAttempt,
  SIGNUP_RATE_LIMIT_MESSAGE,
  takeResetRequestToken,
} from "@/lib/login-security";
import { CONSENT_ERROR, consentGiven, consentRecord } from "@/lib/legal/consent";
import { hashPassword, verifyPassword } from "@/lib/password";
import { hashToken, newToken } from "@/lib/tokens";
import { DAY, MINUTE, takeToken } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { passwordChangedEmail, passwordResetEmail, verificationEmail, welcomeEmail } from "@/lib/email-templates";
import { SITE_URL } from "@/lib/site";
import { getLocale } from "@/lib/i18n/server";
import { parseLocale, type Locale } from "@/lib/i18n/locales";
import {
  loginSchema,
  signupSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation";

// Redirecting straight to the role's own dashboard (instead of the generic
// "/dashboard", which itself just looks up the role and redirects again)
// saves a full extra server round-trip — and a second flash of loading UI —
// on every single login and signup.
function dashboardPathForRole(role: Role) {
  if (role === "ADMIN") return "/admin";
  return role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator";
}

export type ActionState = { error?: string } | undefined;

export type CheckLoginState =
  | { error?: string; requiresTwoFactor?: boolean; proceed?: boolean; role?: Role }
  | undefined;

// Step 1 of login: a pre-flight check so the UI knows whether to ask for a
// 2FA code before ever calling signIn. Never establishes a session itself —
// authorize() below re-verifies everything independently regardless of what
// this returns, so this step existing or being skipped can't bypass anything.
export async function checkLoginAction(_prevState: CheckLoginState, formData: FormData): Promise<CheckLoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please enter a valid email and password (min. 8 characters)." };
  }
  const { email, password } = parsed.data;

  if (await isRateLimited(email)) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // The same bcrypt work whether or not the address has an account (see password.ts).
  const valid = await verifyPassword(user, password);

  if (!user || !valid) {
    await logLoginAttempt({ email, succeeded: false, userId: user?.id });
    return { error: "Incorrect email or password." };
  }

  if (user.suspendedAt) {
    await logLoginAttempt({ email, succeeded: false, userId: user.id });
    return { error: "This account has been suspended. Contact us via the Imprint page if you think this is a mistake." };
  }

  if (user.totpEnabled) return { requiresTwoFactor: true, role: user.role };
  return { proceed: true, role: user.role };
}

// Step 2 (or the only step, when 2FA isn't enabled): the actual sign-in.
// `code` is empty when 2FA isn't required; authorize() ignores it in that case.
// `role` comes from checkLoginAction's own lookup (carried through as a
// hidden field, same as email/password below) — re-querying it here would
// just repeat a lookup step 1 already did, purely to compute a redirect
// path, on every single login.
export async function completeLoginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const code = formData.get("code");
  const role = formData.get("role");

  const redirectTo = `${dashboardPathForRole(typeof role === "string" ? (role as Role) : "CREATOR")}?welcome=1`;

  try {
    await signIn("credentials", { email, password, code, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect code. Please try again." };
    }
    throw error;
  }
}

// Just email/password/role — the rest (company name, or display
// name/niche/platforms) is collected right after by the onboarding wizard
// at /onboarding, so this step alone is enough to get someone signed in.
export async function signupAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!consentGiven(formData)) return { error: CONSENT_ERROR };
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }
  const data = parsed.data;

  if (await isSignupRateLimited()) {
    return { error: SIGNUP_RATE_LIMIT_MESSAGE };
  }
  await logSignupAttempt();

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "This email is already registered." };
  }

  const passwordHash = await hashPassword(data.password);
  // The language the visitor is using: kept on the account, and the one the first email is written in.
  const locale = await getLocale();

  const user =
    data.role === "STARTUP"
      ? await prisma.user.create({
          data: {
            email: data.email,
            passwordHash,
            role: "STARTUP",
            locale,
            ...consentRecord(),
            startupProfile: { create: { companyName: "" } },
          },
        })
      : await prisma.user.create({
          data: {
            email: data.email,
            passwordHash,
            role: "CREATOR",
            locale,
            ...consentRecord(),
            creatorProfile: { create: { displayName: "" } },
          },
        });

  // The welcome email, with the verification link in it. Straight away, so
  // the link is waiting once onboarding is done; after the response (it
  // still runs through the redirect below), so signing up doesn't wait on
  // the mail provider.
  after(() => sendVerificationEmail(user.id, user.email, locale, data.role));

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic login failed. Please log in manually." };
    }
    throw error;
  }
}

export async function logoutAction() {
  // Ending the session on the server too: the cookie is a signed token that would otherwise stay
  // valid until it expires, for whoever copied it.
  const session = await auth();
  if (session?.sid) {
    await prisma.revokedSession
      .create({ data: { sid: session.sid, expiresAt: new Date(Date.now() + 31 * DAY) } })
      .catch(() => undefined);
  }
  // Not "/" — the landing page was pulled while someone else rebuilds it.
  await signOut({ redirectTo: "/login" });
}

// Every session of this account except the one that asks, e.g. after losing a phone.
export async function signOutEverywhereAction(): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { sessionsRevokedAt: new Date(), keptSessionId: session.sid || null },
  });
  return { success: true };
}

export type PasswordActionState = { error?: string; success?: boolean } | undefined;

export async function changePasswordAction(
  _prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please fill in both fields correctly." };
  }

  // This checks a password on behalf of whoever holds the session: without a limit a stolen cookie
  // is a way to guess the password.
  if (!(await takeToken("password-check", session.user.id, 5, 15 * MINUTE))) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await verifyPassword(user, parsed.data.currentPassword);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  // Every other device is logged out within minutes; this one stays.
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, sessionsRevokedAt: new Date(), keptSessionId: session.sid || null },
  });
  after(() => sendPasswordChangedEmail(user.email, parseLocale(user.locale)));

  return { success: true };
}

export type ForgotPasswordState = { error?: string; success?: boolean } | undefined;

// The response is identical whether or not the email is registered — only
// the branch below differs, never what the caller sees — so submitting a
// stranger's email can't be used to probe which addresses have accounts.
export async function requestPasswordResetAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please enter a valid email address." };

  // Limited per network address, and an answer that never depends on the account: not even "too many
  // requests" is said only for addresses that exist (that told anyone which accounts there are).
  if (!(await takeResetRequestToken())) return { success: true };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !(await isPasswordResetRateLimited(user.id))) {
    const token = newToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    // After the response, so how long it takes doesn't depend on whether a mail was sent.
    after(() =>
      sendEmail({ to: user.email, ...passwordResetEmail(`${SITE_URL}/reset-password/${token}`, parseLocale(user.locale)) }),
    );
  }

  return { success: true };
}

export type ResetPasswordState = { error?: string } | undefined;

export async function resetPasswordAction(
  token: string,
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid password." };
  }

  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(parsed.data.password);

  // The link is used exactly once even if two requests arrive together: only one update can flip usedAt.
  const userId = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    const row = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } });
    // A reset is often because someone else got in: every device is logged out.
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash, sessionsRevokedAt: new Date(), keptSessionId: null },
    });
    // Any other reset link of this account that is still open dies with it.
    await tx.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } });
    return row.userId;
  });
  if (!userId) return { error: "This reset link is invalid or has expired." };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, locale: true } });
  after(() => sendPasswordChangedEmail(user.email, parseLocale(user.locale)));

  redirect("/login");
}

export type GenerateVerificationState = { error?: string; sent?: boolean } | undefined;

// /dashboard/verify-email calls this on every visit, and sign-up has
// usually just sent a link: one email every few minutes is plenty, and the
// page says "sent" either way.
const VERIFICATION_RESEND_AFTER_MS = 5 * 60 * 1000;

export async function generateEmailVerificationAction(): Promise<GenerateVerificationState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  // Per account and per network: this sends mail to whatever address the account has.
  if (!(await takeResetRequestToken())) return { sent: true };
  const recent = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: session.user.id,
      usedAt: null,
      createdAt: { gt: new Date(Date.now() - VERIFICATION_RESEND_AFTER_MS) },
    },
    select: { id: true },
  });
  if (!recent) await sendVerificationEmail(session.user.id, session.user.email!, await getLocale());

  return { sent: true };
}

// A fresh 24-hour link, mailed: inside the welcome email right after
// sign-up (pass the new account's role), on its own when asked for again.
async function sendVerificationEmail(userId: string, email: string, locale: Locale, welcomeAs?: "CREATOR" | "STARTUP") {
  const token = newToken();
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const url = `${SITE_URL}/verify-email/${token}`;
  await sendEmail({ to: email, ...(welcomeAs ? welcomeEmail(url, welcomeAs, locale) : verificationEmail(url, locale)) });
}

// After every change and reset, so a change someone else made doesn't go
// unnoticed.
async function sendPasswordChangedEmail(email: string, locale: Locale) {
  await sendEmail({ to: email, ...passwordChangedEmail(`${SITE_URL}/forgot-password`, locale) });
}

export type ConfirmVerificationState = { error?: string; success?: boolean } | undefined;

// prevState/formData are unused but required by useActionState's call signature.
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function confirmEmailVerificationAction(
  token: string,
  _prevState: ConfirmVerificationState,
  _formData: FormData,
): Promise<ConfirmVerificationState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const tokenHash = hashToken(token);
  const verifyToken = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!verifyToken || verifyToken.usedAt || verifyToken.expiresAt < new Date()) {
    return { error: "This verification link is invalid or has expired." };
  }

  // Used exactly once even if two requests arrive together.
  const claimed = await prisma.emailVerificationToken.updateMany({
    where: { id: verifyToken.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return { error: "This verification link is invalid or has expired." };

  // (Two-factor can't be switched on before this point, see startTwoFactorEnrollmentAction, so an
  // address someone only typed into the sign-up form can't have an authenticator planted on it.)
  await prisma.user.update({ where: { id: verifyToken.userId }, data: { emailVerified: true } });

  return { success: true };
}
