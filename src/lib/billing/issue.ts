import type { InvoiceKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseTerms } from "@/lib/deals/terms";
import { parseTaxSnapshot } from "@/lib/deals/parties";
import { splitVatInclusive } from "@/lib/tax/engine";
import { bodyOf, buildBrandInvoice, buildCreatorCreditNote, documentIsConsistent, formatInvoiceNumber, invoiceSequenceKey, type DealDocumentInput, type InvoiceDraft } from "@/lib/billing/invoice";
import { platformIssuer } from "@/lib/billing/issuer";

// A document that was written by this call.
export type IssuedDocument = { id: string; kind: InvoiceKind; number: string; recipientUserId: string };

export type IssueResult = { issued: InvoiceKind[]; documents: IssuedDocument[]; skipped: "NO_ISSUER" | "NO_SNAPSHOT" | "NOT_COMPLETED" | null };

export function berlinYear(now: Date): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", year: "numeric" }).format(now));
}

// Writes the brand invoice and the creator's credit note for a completed deal, each with the next number in its series.
// Safe to call again: a kind that exists is left alone, and the counter and the invoice go in one transaction, so a
// failure leaves no gap in the numbering.
export async function issueDealInvoices(dealId: string, now = new Date()): Promise<IssueResult> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { interest: { include: { request: { include: { startup: true } }, creator: true } }, invoices: { select: { kind: true } } },
  });
  if (!deal || deal.status !== "COMPLETED") return { issued: [], documents: [], skipped: "NOT_COMPLETED" };

  const snapshot = parseTaxSnapshot(deal.taxSnapshot);
  if (!snapshot) return { issued: [], documents: [], skipped: "NO_SNAPSHOT" };
  const platform = platformIssuer();
  if (!platform) return { issued: [], documents: [], skipped: "NO_ISSUER" };

  const terms = parseTerms(deal.terms);
  // What the creator really got: if a side went Pro after the contract, the payout is higher than the one in the terms
  // (open-deal-fees.ts). The creator's VAT share is carved out of it at the rate fixed in the snapshot.
  const payoutCents = deal.interest.payoutCents ?? terms.payoutCents;
  const creatorSplit = splitVatInclusive(payoutCents, snapshot.tax.creator.rateBp);
  const tax = { ...snapshot.tax, creator: { ...snapshot.tax.creator, grossCents: payoutCents, ...creatorSplit } };
  const input: DealDocumentInput = {
    dealId,
    requestTitle: terms.requestTitle,
    contentFormats: terms.contentFormats,
    usage: terms.usage,
    amountCents: terms.amountCents,
    payoutCents,
    usageFeeCents: terms.usage.type === "ORGANIC_ONLY" ? 0 : (terms.usage.feeCents ?? 0),
    tax,
    platform,
    brand: snapshot.brand,
    creator: snapshot.creator,
    servicePeriod: { start: deal.firstLiveAt ?? deal.fundedAt ?? now, end: deal.verificationEndsAt ?? now },
  };

  const wanted: { draft: InvoiceDraft; recipientUserId: string }[] = [
    { draft: buildBrandInvoice(input), recipientUserId: deal.interest.request.startup.userId },
    { draft: buildCreatorCreditNote(input), recipientUserId: deal.interest.creator.userId },
  ];
  const have = new Set(deal.invoices.map((i) => i.kind));
  const year = berlinYear(now);

  const issued: InvoiceKind[] = [];
  const documents: IssuedDocument[] = [];
  for (const { draft, recipientUserId } of wanted) {
    if (have.has(draft.kind)) continue;
    if (!documentIsConsistent(draft)) throw new Error(`Invoice for deal ${dealId} does not add up (${draft.kind}).`);
    const created = await prisma.$transaction(async (tx) => {
      const sequence = await tx.invoiceSequence.upsert({
        where: { key: invoiceSequenceKey(draft.kind, year) },
        create: { key: invoiceSequenceKey(draft.kind, year), lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      return tx.invoice.create({
        data: {
          number: formatInvoiceNumber(draft.kind, year, sequence.lastNumber),
          kind: draft.kind,
          dealId,
          recipientUserId,
          issuedAt: now,
          servicePeriodStart: draft.servicePeriod.start,
          servicePeriodEnd: draft.servicePeriod.end,
          netCents: draft.netCents,
          vatCents: draft.vatCents,
          grossCents: draft.grossCents,
          vatRateBp: draft.vatRateBp,
          taxTreatment: draft.taxTreatment,
          legalNote: draft.legalNote,
          issuer: draft.issuer as unknown as Prisma.InputJsonValue,
          recipient: draft.recipient as unknown as Prisma.InputJsonValue,
          lines: bodyOf(draft) as unknown as Prisma.InputJsonValue,
        },
      });
    });
    issued.push(created.kind);
    documents.push({ id: created.id, kind: created.kind, number: created.number, recipientUserId });
  }
  return { issued, documents, skipped: null };
}

