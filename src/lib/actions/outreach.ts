"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type OutreachSide } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { marketingEntryUrl, marketingWelcomeEmail } from "@/lib/email-templates";
import { outreachOptOutUrl } from "@/lib/outreach-opt-out";
import { landingCrowd } from "@/lib/landing-crowd";

const PATH = "/admin/mailing";

const emailSchema = z.string().trim().email("That doesn't look like an email address.").max(254);
const nameSchema = z.string().trim().min(1, "Add a name.").max(80, "Keep the name under 80 characters.");

const subjectSchema = z.string().trim().min(3, "Write a subject of at least 3 characters.").max(120, "Keep the subject under 120 characters.");

function sendFailure(err: unknown): string {
  console.error("Outreach send failed:", err);
  if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2021" || err.code === "P2022")) {
    return "The mailing database is out of date. Redeploy, then try again.";
  }
  return "Sending failed. Try a smaller group, then send again.";
}

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
  rawIds: string[],
): Promise<{ error?: string; sent?: number; failed?: { email: string; error: string }[] }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  const subject = subjectSchema.safeParse(rawSubject);
  if (!subject.success) return { error: subject.error.issues[0].message };
  const ids = [...new Set(rawIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return { error: "Mark the addresses you want to send to." };

  try {
    const rows = await prisma.outreachAddress.findMany({
      where: { side, id: { in: ids } },
      orderBy: { createdAt: "asc" },
    });
    if (rows.length === 0) return { error: "Mark the addresses you want to send to." };

    const url = marketingEntryUrl(side);
    const crowd = await landingCrowd();
    const count = side === "CREATOR" ? crowd.brands : crowd.creators;
    const mailing = await prisma.outreachMailing.create({ data: { side, subject: subject.data } });
    const failed: { email: string; error: string }[] = [];
    let sent = 0;
    for (const row of rows) {
      const message = marketingWelcomeEmail(url, side, subject.data, row.name, count, outreachOptOutUrl(row.email, side));
      const result = await sendEmail({ to: row.email, ...message });
      if (!result.ok) {
        failed.push({ email: row.email, error: result.error });
        continue;
      }
      sent += 1;
      await prisma.outreachDelivery
        .create({
          data: {
            mailingId: mailing.id,
            addressId: row.id,
            recipientName: row.name,
            recipientEmail: row.email,
            resendId: result.id || `untracked_${mailing.id}_${row.id}`,
          },
        })
        .catch((err) => console.error("Outreach send was delivered but not saved:", err));
    }
    if (sent === 0) await prisma.outreachMailing.delete({ where: { id: mailing.id } });
    else revalidatePath(PATH);
    return { sent, failed };
  } catch (err) {
    return { error: sendFailure(err) };
  }
}
