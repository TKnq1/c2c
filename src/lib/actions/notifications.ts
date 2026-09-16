"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { markAllRead } from "@/lib/notifications";

export async function markNotificationsReadAction() {
  const session = await auth();
  if (!session) return;

  await markAllRead(session.user.id);
  // The unread badge lives in the dashboard layout, shared across every
  // route — revalidate the layout segment, not just this page.
  revalidatePath("/dashboard", "layout");
}
