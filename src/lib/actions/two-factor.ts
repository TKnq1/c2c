"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, totpUri, verifyTotpCode } from "@/lib/totp";
import { generateRecoveryCodes, saveRecoveryCodes } from "@/lib/recovery-codes";
import { totpCodeSchema, disableTwoFactorSchema } from "@/lib/validation";

function revalidateProfiles() {
  revalidatePath("/dashboard/startup/settings");
  revalidatePath("/dashboard/creator/settings");
}

export type StartTwoFactorState = { error?: string; secret?: string; qrDataUrl?: string };

// Saves the new secret right away (gated by totpEnabled staying false), so
// confirmTwoFactorEnrollmentAction can verify against it without the client
// having to round-trip it back — same "server holds the pending state"
// pattern as the password reset / email verification tokens.
export async function startTwoFactorEnrollmentAction(): Promise<StartTwoFactorState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.totpEnabled) return { error: "Two-factor authentication is already enabled." };

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } });

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

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.totpSecret) return { error: "Start enrollment again." };

  if (!verifyTotpCode(user.totpSecret, parsed.data.code)) {
    return { error: "That code didn't match. Check your app and try again." };
  }

  const recoveryCodes = generateRecoveryCodes();
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  await saveRecoveryCodes(user.id, recoveryCodes);

  revalidateProfiles();
  return { success: true, recoveryCodes };
}

export type DisableTwoFactorState = { error?: string; success?: boolean } | undefined;

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

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) return { error: "Incorrect password." };

  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null } });
  await prisma.recoveryCode.deleteMany({ where: { userId: user.id } });

  revalidateProfiles();
  return { success: true };
}
