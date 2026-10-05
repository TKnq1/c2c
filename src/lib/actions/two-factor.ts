"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, matchTotpStep, totpUri } from "@/lib/totp";
import { generateRecoveryCodes, saveRecoveryCodes, verifyAndConsumeRecoveryCode } from "@/lib/recovery-codes";
import { consumeTotpCode } from "@/lib/totp-login";
import { open, seal } from "@/lib/secret-box";
import { verifyPassword } from "@/lib/password";
import { MINUTE, takeToken } from "@/lib/rate-limit";
import { emailIsVerified, VERIFY_EMAIL_MESSAGE } from "@/lib/verified";
import { totpCodeSchema, disableTwoFactorSchema } from "@/lib/validation";

function revalidateProfiles() {
  revalidatePath("/dashboard/startup/settings");
  revalidatePath("/dashboard/creator/settings");
  revalidatePath("/admin-security");
}

const TOO_MANY = "Too many attempts. Try again in 15 minutes.";

export type StartTwoFactorState = { error?: string; secret?: string; qrDataUrl?: string };

// Saves the new secret right away (gated by totpEnabled staying false), so
// confirmTwoFactorEnrollmentAction can verify against it without the client
// having to round-trip it back — same "server holds the pending state"
// pattern as the password reset / email verification tokens.
//
// Switching two-factor on asks for the password: a stolen session cookie alone must not be able to
// put the account behind an authenticator only the thief holds. And only a verified address can have
// it, so an account someone opened with another person's email can't be locked to them.
export async function startTwoFactorEnrollmentAction(password: string): Promise<StartTwoFactorState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };
  if (typeof password !== "string" || password.length === 0 || password.length > 256) return { error: "Incorrect password." };

  if (!(await takeToken("password-check", session.user.id, 5, 15 * MINUTE))) return { error: TOO_MANY };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!(await verifyPassword(user, password))) return { error: "Incorrect password." };
  if (user.totpEnabled) return { error: "Two-factor authentication is already enabled." };
  if (!(await emailIsVerified(user.id))) return { error: VERIFY_EMAIL_MESSAGE };

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: seal(secret), totpLastStep: null } });

  const qrDataUrl = await QRCode.toDataURL(totpUri(secret, user.email));
  return { secret, qrDataUrl };
}

export type ConfirmTwoFactorState = { error?: string; success?: boolean; recoveryCodes?: string[] } | undefined;

export async function confirmTwoFactorEnrollmentAction(
  _prevState: ConfirmTwoFactorState,
  formData: FormData,
): Promise<ConfirmTwoFactorState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const parsed = totpCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid code." };
  }

  if (!(await takeToken("totp-confirm", session.user.id, 10, 15 * MINUTE))) return { error: TOO_MANY };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.totpSecret || user.totpEnabled) return { error: "Start enrollment again." };

  const step = matchTotpStep(open(user.totpSecret), parsed.data.code);
  if (step === null) {
    return { error: "That code didn't match. Check your app and try again." };
  }

  const recoveryCodes = generateRecoveryCodes();
  // The code that confirmed it is spent: it can't be used again to sign in.
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true, totpLastStep: step } });
  await saveRecoveryCodes(user.id, recoveryCodes);

  revalidateProfiles();
  return { success: true, recoveryCodes };
}

export type DisableTwoFactorState = { error?: string; success?: boolean } | undefined;

// Switching it off needs both the password and a current code (or a recovery code): the password alone
// is exactly what two-factor protects against losing.
export async function disableTwoFactorAction(
  _prevState: DisableTwoFactorState,
  formData: FormData,
): Promise<DisableTwoFactorState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const parsed = disableTwoFactorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter your current password." };
  }

  if (!(await takeToken("password-check", session.user.id, 5, 15 * MINUTE))) return { error: TOO_MANY };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!(await verifyPassword(user, parsed.data.password))) return { error: "Incorrect password." };

  if (user.totpEnabled) {
    const code = parsed.data.code.trim();
    const validCode = (await consumeTotpCode(user, code)) || (await verifyAndConsumeRecoveryCode(user.id, code));
    if (!validCode) return { error: "That code didn't match. Check your app and try again." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null, totpLastStep: null } });
  await prisma.recoveryCode.deleteMany({ where: { userId: user.id } });

  revalidateProfiles();
  return { success: true };
}
