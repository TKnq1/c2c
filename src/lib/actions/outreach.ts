"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type OutreachSide } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { marketingEntryUrl, marketingWelcomeEmail } from "@/lib/email-templates";
import { outreachListUnsubscribeHeaders, outreachOptOutUrl } from "@/lib/outreach-opt-out";
import { outreachEnabled, OUTREACH_PAUSED_MESSAGE } from "@/lib/outreach-enabled";
import { hashOutreachEmail, isOutreachSuppressed, suppressedEmailHashes } from "@/lib/outreach-suppression";
import { landingCrowd } from "@/lib/landing-crowd";

const PATH = "/admin/mailing";

const emailSchema = z.string().trim().email("That doesn't look like an email address.").max(254);
const nameSchema = z.string().trim().min(1, "Add a name.").max(80, "Keep the name under 80 characters.");

// What the recipient is told as the reason for the mail, so it has to be something they would recognise.
const consentSchema = z
  .string()
  .trim()
  .min(10, "Say how this person agreed to hear from comtor (at least 10 characters).")
  .max(300, "Keep it under 300 characters.");

const subjectSchema = z.string().trim().min(3, "Write a subject of at least 3 characters.").max(120, "Keep the subject under 120 characters.");

function sendFailure(err: unknown): string {
  console.error("Outreach send failed:", err);
  if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2021" || err.code === "P2022")) {
    return "The mailing database is out of date. Redeploy, then try again.";
  }
  return "Sending failed. Try a smaller group, then send again.";
}

export async function addOutreachAddressAction(
  side: OutreachSide,
  rawName: string,
  rawEmail: string,
  rawConsent: string,
): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  if (!outreachEnabled()) return { error: OUTREACH_PAUSED_MESSAGE };
  const name = nameSchema.safeParse(rawName);
  if (!name.success) return { error: name.error.issues[0].message };
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const consent = consentSchema.safeParse(rawConsent);
  if (!consent.success) return { error: consent.error.issues[0].message };
  const email = parsed.data.toLowerCase();

  if (await isOutreachSuppressed(email)) return { error: "This address asked to stop and can't be added again." };
  const existing = await prisma.outreachAddress.findUnique({ where: { email_side: { email, side } } });
  if (existing) return { error: "That address is already on this list." };

  const created = await prisma.outreachAddress.create({
    data: { name: name.data, email, side, consentNote: consent.data, consentAt: new Date() },
  });
  // The address itself stays out of the log: the log outlives the address.
  await audit(admin.user.id, "outreach.add", created.id, { side });
  revalidatePath(PATH);
  return {};
}

export async function removeOutreachAddressAction(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  // The record of what was sent to the address goes with it.
  await prisma
    .$transaction([prisma.outreachDelivery.deleteMany({ where: { addressId: id } }), prisma.outreachAddress.delete({ where: { id } })])
    .catch(() => null);
  await audit(admin.user.id, "outreach.remove", id);
  revalidatePath(PATH);
  return {};
}

export async function sendOutreachAction(
  side: OutreachSide,
  rawSubject: string,
  rawIds: string[],
): Promise<{ error?: string; sent?: number; failed?: { email: string; error: string }[] }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  if (!outreachEnabled()) return { error: OUTREACH_PAUSED_MESSAGE };
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

    // Only people who agreed, and who haven't asked to stop since.
    const failed: { email: string; error: string }[] = [];
    const suppressed = await suppressedEmailHashes(rows.map((row) => row.email));
    const eligible = rows.filter((row) => {
      if (suppressed.has(hashOutreachEmail(row.email))) {
        failed.push({ email: row.email, error: "Asked to stop" });
        return false;
      }
      if (!row.consentNote) {
        failed.push({ email: row.email, error: "No consent recorded" });
        return false;
      }
      return true;
    });
    if (eligible.length === 0) {
      return { error: "Nobody marked can be mailed: every address needs a recorded consent and must not have asked to stop.", failed };
    }

    const url = marketingEntryUrl(side);
    const crowd = await landingCrowd();
    const count = side === "CREATOR" ? crowd.brands : crowd.creators;
    const mailing = await prisma.outreachMailing.create({ data: { side, subject: subject.data } });
    let sent = 0;
    for (const row of eligible) {
      const message = marketingWelcomeEmail(
        url,
        side,
        subject.data,
        row.name,
        count,
        outreachOptOutUrl(row.email, side),
        row.consentNote ?? "",
      );
      const result = await sendEmail({ to: row.email, ...message, headers: outreachListUnsubscribeHeaders(row.email, side) });
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
    await audit(admin.user.id, "outreach.send", mailing.id, { side, subject: subject.data, sent, failed: failed.length });
    return { sent, failed };
  } catch (err) {
    return { error: sendFailure(err) };
  }
}
