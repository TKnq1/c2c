"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { refreshExternalSnapshots } from "@/lib/admin-external";

// Asks Sentry and Stripe again right now, instead of waiting for the next background refresh.
export async function refreshTechAction(): Promise<{ error?: string }> {
  const session = await requireAdmin();
  if (!session) return { error: "Keine Berechtigung." };
  await refreshExternalSnapshots(new Date(), true);
  revalidatePath("/admin", "layout");
  return {};
}
