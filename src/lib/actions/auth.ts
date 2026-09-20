"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { signIn, signOut, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isRateLimited,
  logLoginAttempt,
  RATE_LIMIT_MESSAGE,
  isPasswordResetRateLimited,
  RESET_RATE_LIMIT_MESSAGE,
} from "@/lib/login-security";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
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
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    await logLoginAttempt({ email, succeeded: false, userId: user?.id });
    return { error: "Incorrect email or password." };
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
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "This email is already registered." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  if (data.role === "STARTUP") {
    await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "STARTUP",
        startupProfile: { create: { companyName: "" } },
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "CREATOR",
        creatorProfile: { create: { displayName: "", niche: "" } },
      },
    });
  }

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
  // Not "/" — the landing page was pulled while someone else rebuilds it.
  await signOut({ redirectTo: "/login" });
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

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

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

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    if (await isPasswordResetRateLimited(user.id)) return { error: RESET_RATE_LIMIT_MESSAGE };

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    await sendEmail({
      to: user.email,
      subject: "Reset your C2C password",
      html: `<p>Someone requested a password reset for this account.</p><p><a href="${SITE_URL}/reset-password/${token}">Reset your password</a> — this link expires in 1 hour.</p><p>If this wasn't you, you can ignore this email.</p>`,
    });
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

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });

  redirect("/login");
}

export type GenerateVerificationState = { error?: string; sent?: boolean } | undefined;

export async function generateEmailVerificationAction(): Promise<GenerateVerificationState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: { userId: session.user.id, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  await sendEmail({
    to: session.user.email!,
    subject: "Verify your C2C email",
    html: `<p><a href="${SITE_URL}/verify-email/${token}">Verify your email</a> — this link expires in 24 hours.</p>`,
  });

  return { sent: true };
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
  const verifyToken = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!verifyToken || verifyToken.usedAt || verifyToken.expiresAt < new Date()) {
    return { error: "This verification link is invalid or has expired." };
  }

  await prisma.user.update({ where: { id: verifyToken.userId }, data: { emailVerified: true } });
  await prisma.emailVerificationToken.update({ where: { id: verifyToken.id }, data: { usedAt: new Date() } });

  return { success: true };
}
