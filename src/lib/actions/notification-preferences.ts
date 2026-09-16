"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function updateNotificationPreferencesAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      notifyNewRequests: formData.get("notifyNewRequests") === "on",
      notifyNewInterest: formData.get("notifyNewInterest") === "on",
      notifyNewCreators: formData.get("notifyNewCreators") === "on",
      notifyMessages: formData.get("notifyMessages") === "on",
      notifyPayments: formData.get("notifyPayments") === "on",
      notifyDeposits: formData.get("notifyDeposits") === "on",
    },
  });

  revalidatePath("/dashboard/creator/settings");
  revalidatePath("/dashboard/startup/settings");
  return { success: true };
}
