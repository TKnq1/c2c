"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBrandProfileSchema, updateCreatorProfileSchema } from "@/lib/validation";

export type ActionState = { error?: string; success?: boolean } | undefined;

// The client resizes/compresses before submitting (see AvatarUpload), so a
// legitimate upload lands well under this — it's a ceiling against someone
// bypassing that client-side step, not the expected normal size.
const MAX_AVATAR_BYTES = 500 * 1024;

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

// Only re-encode and save a new image if the user actually picked one — an
// untouched file input still submits an empty File, not null. `avatarUrl:
// null` (vs `undefined`) tells Prisma to explicitly clear the field, for
// the "Remove" button — a plain unchanged form must leave it untouched.
async function processAvatarUpload(
  formData: FormData,
  label: string,
): Promise<{ avatarUrl?: string | null; error?: string }> {
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith("image/")) {
      return { error: `${label} must be an image file.` };
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { error: `${label} must be under 2MB.` };
    }
    return { avatarUrl: await fileToDataUrl(avatarFile) };
  }
  if (formData.get("avatarRemove") === "1") {
    return { avatarUrl: null };
  }
  return {};
}

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

  const { platforms, ...rest } = parsed.data;
  await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: {
      ...rest,
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
