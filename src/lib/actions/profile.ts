"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBrandProfileSchema, updateCreatorProfileSchema } from "@/lib/validation";
import { processAvatarUpload } from "@/lib/avatar-upload";
import { creatorNicheColumns } from "@/lib/creator-niches";

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function updateCreatorProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") {
    return { error: "Not authorized." };
  }

  const parsed = updateCreatorProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }

  const { avatarUrl, error } = await processAvatarUpload(formData, "Photo");
  if (error) return { error };

  const { platforms, niches, ...rest } = parsed.data;
  await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: {
      ...rest,
      ...creatorNicheColumns(niches),
      avatarUrl,
      // Replace the whole list rather than diffing it — simplest correct
      // approach for a handful of rows with no other data hanging off them.
      platforms: {
        deleteMany: {},
        create: platforms.map((p) => ({ ...p, url: p.url || null })),
      },
    },
  });
  revalidatePath("/dashboard/creator");
  revalidatePath("/dashboard/creator/settings");
  return { success: true };
}

export async function updateBrandProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    return { error: "Not authorized." };
  }

  const parsed = updateBrandProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }

  const { avatarUrl, error } = await processAvatarUpload(formData, "Logo");
  if (error) return { error };

  const { socialLinks, website, ...rest } = parsed.data;
  await prisma.startupProfile.update({
    where: { userId: session.user.id },
    data: {
      ...rest,
      website: website || null,
      avatarUrl,
      socialLinks: { deleteMany: {}, create: socialLinks },
    },
  });
  revalidatePath("/dashboard/startup");
  revalidatePath("/dashboard/startup/settings");
  return { success: true };
}
