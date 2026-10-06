"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { waitlistConfirmationEmail } from "@/lib/email-templates";
import { getLocale } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import { HOUR, takeIpToken } from "@/lib/rate-limit";

export type WaitlistState = { ok?: boolean; alreadyConfirmed?: boolean; error?: string } | undefined;

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address."),
  role: z.enum(["creator", "brand"]).optional(),
});

// Anyone can type any address into the form, so one confirmation email per
// address every few minutes; trying again sooner gets the same answer.
const RESEND_AFTER_MS = 10 * 60 * 1000;
// Unconfirmed addresses are deleted after this (privacy policy).
const UNCONFIRMED_KEPT_MS = 30 * 24 * 60 * 60 * 1000;

// The landing page's "tell me when it's out", with double opt-in: the
// address gets a link first, and only confirmed addresses get the launch
// email. Signing up again just sends the link again (or says it's done).
export async function joinWaitlistAction(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  // A field people never see; bots fill in everything.
  if (formData.get("website")) return { ok: true };

  const parsed = waitlistSchema.safeParse({
    email: formData.get("email") ?? "",
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  // One confirmation mail per address every ten minutes isn't enough alone: with changing addresses this
  // form could send mail to anyone. Per network address, then.
  if (!(await takeIpToken("waitlist", 5, HOUR))) return { error: "Too many attempts. Try again later." };

  const { email, role } = parsed.data;
  // The confirmation is written in the language the visitor is reading the page in.
  const locale = await getLocale();
  try {
    // Housekeeping here rather than in a cron: this is where entries come in.
    await prisma.waitlistEntry.deleteMany({
      where: { confirmedAt: null, createdAt: { lt: new Date(Date.now() - UNCONFIRMED_KEPT_MS) } },
    });

    const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
    // Said the same for an address that is already on the list: the form can't be used to check who is.
    if (existing?.confirmedAt) return { ok: true };
    if (existing?.confirmSentAt && Date.now() - existing.confirmSentAt.getTime() < RESEND_AFTER_MS) {
      return { ok: true };
    }

    // The same link as last time, so an older email still works.
    const confirmToken = existing?.confirmToken ?? randomBytes(32).toString("hex");
    await prisma.waitlistEntry.upsert({
      where: { email },
      create: {
        email,
        role: role === "brand" ? "STARTUP" : role === "creator" ? "CREATOR" : null,
        confirmToken,
        confirmSentAt: new Date(),
      },
      update: { confirmToken, confirmSentAt: new Date() },
    });
    after(() =>
      sendEmail({ to: email, ...waitlistConfirmationEmail(`${SITE_URL}/waitlist/confirm/${confirmToken}`, locale) }),
    );
  } catch {
    return { error: "That didn't work. Try again in a moment." };
  }
  return { ok: true };
}

export type ConfirmWaitlistState = { ok?: boolean; error?: string } | undefined;

// The click that counts as consent. A button on the page rather than the
// link itself: mail scanners open every link in an email, and that mustn't
// sign anyone up.
export async function confirmWaitlistAction(token: string): Promise<ConfirmWaitlistState> {
  const entry = await prisma.waitlistEntry.findUnique({ where: { confirmToken: token } });
  if (!entry) return { error: "This link doesn't work anymore. Leave your email on comtor.app again to get a new one." };
  if (!entry.confirmedAt) {
    await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { confirmedAt: new Date() } });
    revalidatePath("/admin/waitlist");
  }
  return { ok: true };
}

// Admin only: someone asked to be taken off the list (the privacy policy
// promises that), or the address is obviously junk.
export async function removeWaitlistEntryAction(id: string): Promise<{ error?: string } | void> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  await prisma.waitlistEntry.deleteMany({ where: { id } });
  await audit(session.user.id, "waitlist.remove", id);
  revalidatePath("/admin/waitlist");
}
