"use server";

import { redirect } from "next/navigation";
import { completeOutreachOptOut } from "@/lib/outreach-suppression";
import { isOutreachSide, outreachOptOutMatches } from "@/lib/outreach-opt-out";

export async function confirmOutreachOptOut(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const side = String(formData.get("side") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!isOutreachSide(side) || !outreachOptOutMatches(email, side, token)) redirect("/outreach/opt-out");
  await completeOutreachOptOut(email);
  redirect("/outreach/opt-out?done=1");
}
