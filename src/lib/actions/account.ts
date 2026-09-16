"use server";

import bcrypt from "bcryptjs";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteAccountSchema } from "@/lib/validation";

export type DeleteAccountState = { error?: string } | undefined;

export async function deleteAccountAction(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const parsed = deleteAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter your current password." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) return { error: "Incorrect password." };

  // Every user-owned row cascades from here (profile, requests/interests,
  // messages, reviews, notifications, tokens, reports, blocks, ...) per the
  // onDelete: Cascade relations in schema.prisma.
  await prisma.user.delete({ where: { id: user.id } });

  await signOut({ redirectTo: "/login?deleted=1" });
}
