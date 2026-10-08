"use server";

import { revalidatePath } from "next/cache";
import { confirmAdminPassword, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { correctAndAnnounce, issueAndAnnounce } from "@/lib/billing/announce";
import type { CorrectionPatch, PartySide } from "@/lib/billing/correct";
import { type MoneyMoveResult } from "@/lib/payment-release";
import { resolveDealDispute, type DisputeResolution } from "@/lib/deals/payout";
import { verifyStoredVatId } from "@/lib/tax/verify-profile";

// Settling a frozen deal from /admin. The decision is made outside the app (look at the post, the draft, the caption, talk
// to both sides); these carry it out. Like the legacy payment disputes they ask for the admin's password again and leave a
// line in the audit log.

const RESOLUTIONS: DisputeResolution[] = ["RELEASE", "REFUND", "RESUME"];

export async function resolveDealDisputeAction(disputeId: string, resolution: DisputeResolution, note: string, password: string): Promise<MoneyMoveResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  const passwordError = await confirmAdminPassword(session.user.id, password);
  if (passwordError) return { error: passwordError };
  if (!RESOLUTIONS.includes(resolution)) return { error: "Unknown decision." };
  const reason = note.trim();
  if (reason.length < 10) return { error: "Write down why you decided this (at least a sentence)." };

  await audit(session.user.id, `deal.dispute.${resolution.toLowerCase()}`, disputeId, { note: reason.slice(0, 500) });
  const result = await resolveDealDispute(disputeId, session.user.id, resolution, reason);
  revalidatePath("/admin/deals");
  revalidatePath("/admin", "layout");
  return result;
}

// Writes the invoices of a completed deal that does not have them yet (the tax details were missing when it completed).
export async function issueDealInvoicesAction(dealId: string, password: string): Promise<MoneyMoveResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  const passwordError = await confirmAdminPassword(session.user.id, password);
  if (passwordError) return { error: passwordError };

  const result = await issueAndAnnounce(dealId);
  await audit(session.user.id, "deal.invoices.issue", dealId, { issued: result.issued, skipped: result.skipped });
  revalidatePath("/admin/deals");
  if (result.skipped === "NO_ISSUER") return { error: "comtor's tax details are missing: set IMPRINT_VAT_ID or PLATFORM_TAX_NUMBER first." };
  if (result.skipped === "NO_SNAPSHOT") return { error: "This deal has no tax snapshot (it was made before invoicing existed)." };
  if (result.skipped === "NOT_COMPLETED") return { error: "The deal isn't completed yet." };
  return {};
}

export type InvoiceCorrectionFields = { reason: string; name: string; address: string; vatId: string; taxNumber: string };

// Corrects the other side's details on an issued document (the brand on an invoice, the creator on a credit note): the
// document is cancelled and a new one with the corrected details takes its place (src/lib/billing/correct.ts).
export async function correctInvoiceAction(invoiceId: string, fields: InvoiceCorrectionFields, password: string): Promise<MoneyMoveResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  const passwordError = await confirmAdminPassword(session.user.id, password);
  if (passwordError) return { error: passwordError };
  const reason = fields.reason.trim();
  if (reason.length < 10) return { error: "Write down why the document is corrected (at least a sentence)." };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { kind: true } });
  if (!invoice) return { error: "This document doesn't exist." };
  const side: PartySide = invoice.kind === "BRAND_INVOICE" ? "recipient" : "issuer";
  const patch: CorrectionPatch = {
    [side]: { name: fields.name, addressLines: fields.address.split("\n"), vatId: fields.vatId, taxNumber: fields.taxNumber },
  };

  await audit(session.user.id, "invoice.correct", invoiceId, { reason: reason.slice(0, 500), side });
  const result = await correctAndAnnounce({ invoiceId, reason, patch });
  revalidatePath("/admin/deals");
  return result.ok ? {} : { error: result.error };
}

// Asks VIES again for a user's VAT ID, e.g. when a brand says it was wrongly rejected.
export async function recheckVatIdAction(userId: string): Promise<MoneyMoveResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  const exists = await prisma.businessProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!exists) return { error: "This account has no business details." };
  const result = await verifyStoredVatId(userId);
  await audit(session.user.id, "vat.recheck", userId, { status: result?.status ?? null });
  revalidatePath("/admin/deals");
  return result?.status === "VALID" ? {} : { error: `VIES says: ${result?.status ?? "no VAT ID"}.` };
}
