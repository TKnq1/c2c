"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  confirmMarketingConsent,
  requestMarketingConsent,
  withdrawMarketingConsent,
  type MarketingConsentResult,
} from "@/lib/marketing-consent";

export type MarketingConsentState = { status?: MarketingConsentResult } | undefined;

async function currentUserId() {
  const session = await auth();
  if (!session?.user.id || session.user.role === "ADMIN") return null;
  return session.user.id;
}

export async function requestMarketingConsentAction(
  _prev: MarketingConsentState,
  _formData: FormData,
): Promise<MarketingConsentState> {
  const userId = await currentUserId();
  if (!userId) return { status: "failed" };
  const status = await requestMarketingConsent(userId);
  revalidatePath("/dashboard/creator/settings");
  revalidatePath("/dashboard/startup/settings");
  return { status };
}

export async function withdrawMarketingConsentAction(
  _prev: MarketingConsentState,
  _formData: FormData,
): Promise<MarketingConsentState> {
  const userId = await currentUserId();
  if (!userId) return { status: "failed" };
  const status = await withdrawMarketingConsent(userId);
  revalidatePath("/admin/mailing");
  revalidatePath("/dashboard/creator/settings");
  revalidatePath("/dashboard/startup/settings");
  return { status };
}

export async function confirmMarketingConsentAction(
  token: string,
  _prev: { ok?: boolean; error?: boolean } | undefined,
): Promise<{ ok?: boolean; error?: boolean }> {
  const result = await confirmMarketingConsent(token);
  if (result === "invalid") return { error: true };
  revalidatePath("/admin/mailing");
  return { ok: true };
}
