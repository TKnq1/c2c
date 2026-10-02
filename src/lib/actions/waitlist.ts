"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type WaitlistState = { ok?: boolean; error?: string } | undefined;

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address."),
  role: z.enum(["creator", "brand"]).optional(),
});

// The landing page's "tell me when it's out". Signing up twice is fine and
// says the same thing: the address is on the list either way.
export async function joinWaitlistAction(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  // A field people never see; bots fill in everything.
  if (formData.get("website")) return { ok: true };

  const parsed = waitlistSchema.safeParse({
    email: formData.get("email") ?? "",
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  const { email, role } = parsed.data;
  try {
    await prisma.waitlistEntry.upsert({
      where: { email },
      create: { email, role: role === "brand" ? "STARTUP" : role === "creator" ? "CREATOR" : null },
      update: {},
    });
  } catch {
    return { error: "That didn't work. Try again in a moment." };
  }
  return { ok: true };
}

// Admin only: someone asked to be taken off the list (the privacy policy
// promises that), or the address is obviously junk.
export async function removeWaitlistEntryAction(id: string): Promise<{ error?: string } | void> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { error: "Not authorized." };
  await prisma.waitlistEntry.deleteMany({ where: { id } });
  revalidatePath("/admin");
}
