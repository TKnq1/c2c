"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markAllRead } from "@/lib/notifications";

export async function markNotificationsReadAction() {
  const session = await auth();
  if (!session) return;

  await markAllRead(session.user.id);
  // The unread badge lives in the dashboard layout, shared across every
  // route — revalidate the layout segment, not just this page.
  revalidatePath("/dashboard", "layout");
}

export async function deleteNotificationAction(id: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

  // deleteMany (not delete) so this silently no-ops instead of throwing if
  // someone else's id ever got passed in — the userId filter is the real
  // ownership check either way.
  await prisma.notification.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard", "layout");
}
