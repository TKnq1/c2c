"use server";

import { revalidatePath } from "next/cache";
import type { OutreachSide } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { marketingEntryUrl, marketingWelcomeEmail } from "@/lib/email-templates";
import { landingCrowd } from "@/lib/landing-crowd";

const PATH = "/admin/mailing";

const emailSchema = z.string().trim().email("That doesn't look like an email address.").max(254);
const nameSchema = z.string().trim().min(1, "Add a name.").max(80, "Keep the name under 80 characters.");

const subjectSchema = z.string().trim().min(3, "Write a subject of at least 3 characters.").max(120, "Keep the subject under 120 characters.");

async function requireAdmin() {
  const session = await auth();
  if (!session || !hasAdminAccess(session.user)) return null;
  return session;
}

export async function addOutreachAddressAction(
  side: OutreachSide,
  rawName: string,
  rawEmail: string,
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  const name = nameSchema.safeParse(rawName);
  if (!name.success) return { error: name.error.issues[0].message };
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data.toLowerCase();

  const existing = await prisma.outreachAddress.findUnique({ where: { email_side: { email, side } } });
  if (existing) return { error: "That address is already on this list." };

  await prisma.outreachAddress.create({ data: { name: name.data, email, side } });
  revalidatePath(PATH);
  return {};
}

export async function removeOutreachAddressAction(id: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  await prisma.outreachAddress.delete({ where: { id } }).catch(() => null);
  revalidatePath(PATH);
  return {};
}

export async function sendOutreachAction(
  side: OutreachSide,
  rawSubject: string,
): Promise<{ error?: string; sent?: number; failed?: { email: string; error: string }[] }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  const subject = subjectSchema.safeParse(rawSubject);
  if (!subject.success) return { error: subject.error.issues[0].message };

  const rows = await prisma.outreachAddress.findMany({ where: { side }, orderBy: { createdAt: "asc" } });
  if (rows.length === 0) return { error: "This list is empty." };

  const url = marketingEntryUrl(side);
  const crowd = await landingCrowd();
  const count = side === "CREATOR" ? crowd.brands : crowd.creators;
  const mailing = await prisma.outreachMailing.create({ data: { side, subject: subject.data } });
  const failed: { email: string; error: string }[] = [];
  let sent = 0;
  for (const row of rows) {
    const message = marketingWelcomeEmail(url, side, subject.data, row.name, count);
    const result = await sendEmail({ to: row.email, ...message });
    if (result.ok) {
      sent += 1;
      await prisma.outreachDelivery.create({
        data: {
          mailingId: mailing.id,
          addressId: row.id,
          recipientName: row.name,
          recipientEmail: row.email,
          resendId: result.id || `untracked_${mailing.id}_${row.id}`,
        },
      });
    } else failed.push({ email: row.email, error: result.error });
  }
  if (sent === 0) await prisma.outreachMailing.delete({ where: { id: mailing.id } });
  return { sent, failed };
}
