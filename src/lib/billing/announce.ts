import { prisma } from "@/lib/prisma";
import { correctInvoice, type CorrectionPatch, type CorrectionResult } from "@/lib/billing/correct";
import { mailDocuments } from "@/lib/billing/deliver";
import { issueDealInvoices, type IssueResult, type IssuedDocument } from "@/lib/billing/issue";
import { parseTerms } from "@/lib/deals/terms";
import { notifyDealParty } from "@/lib/deals/notify";

// Tells each recipient that a document of theirs is ready, in the app and by e-mail with the PDF attached. Never throws: the
// documents exist whether or not the news gets out.
export async function announceInvoices(dealId: string, documents: IssuedDocument[]): Promise<void> {
  if (documents.length === 0) return;
  try {
    const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { terms: true } });
    if (!deal) return;
    const title = parseTerms(deal.terms).requestTitle;
    for (const document of documents) {
      await notifyDealParty(
        document.recipientUserId,
        document.kind === "BRAND_INVOICE" ? "invoice_issued_brand" : "invoice_issued_creator",
        { title, number: document.number },
        `/dashboard/invoices/${document.id}`,
      );
      await mailDocuments({
        userId: document.recipientUserId,
        kind: document.kind === "BRAND_INVOICE" ? "invoice" : "credit",
        title,
        number: document.number,
        openId: document.id,
        attachIds: [document.id],
      });
    }
  } catch (err) {
    console.error("Announcing the invoices failed", { dealId, err });
  }
}

// Writes the invoice and the credit note of a completed deal (the ones that are still missing) and tells their recipients.
export async function issueAndAnnounce(dealId: string, now = new Date()): Promise<IssueResult> {
  const result = await issueDealInvoices(dealId, now);
  await announceInvoices(dealId, result.documents);
  return result;
}

// Corrects an issued document (see correct.ts) and tells its recipient that it was replaced.
export async function correctAndAnnounce(args: { invoiceId: string; reason: string; patch: CorrectionPatch; now?: Date }): Promise<CorrectionResult> {
  const result = await correctInvoice(args);
  if (!result.ok) return result;
  try {
    const deal = await prisma.deal.findUnique({ where: { id: result.dealId }, select: { terms: true } });
    if (deal) {
      const title = parseTerms(deal.terms).requestTitle;
      await notifyDealParty(
        result.replacement.recipientUserId,
        "invoice_corrected",
        { title, old: result.replacedNumber, new: result.replacement.number },
        `/dashboard/invoices/${result.replacement.id}`,
      );
      await mailDocuments({
        userId: result.replacement.recipientUserId,
        kind: "corrected",
        title,
        number: result.replacement.number,
        replaces: result.replacedNumber,
        openId: result.replacement.id,
        attachIds: [result.cancellation.id, result.replacement.id],
      });
    }
  } catch (err) {
    console.error("Announcing the correction failed", { dealId: result.dealId, err });
  }
  return result;
}
