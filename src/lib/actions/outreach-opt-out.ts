"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isOutreachSide, outreachOptOutMatches } from "@/lib/outreach-opt-out";

export async function confirmOutreachOptOut(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const side = String(formData.get("side") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!isOutreachSide(side) || !outreachOptOutMatches(email, side, token)) redirect("/outreach/opt-out");
  await prisma.outreachAddress.deleteMany({ where: { email: email.trim().toLowerCase(), side } });
  redirect("/outreach/opt-out?done=1");
}
