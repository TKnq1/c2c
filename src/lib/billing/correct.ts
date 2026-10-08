import type { Invoice, InvoiceKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { amountsAddUp, formatInvoiceNumber, invoiceSequenceKey, negateBody, parseBody } from "@/lib/billing/invoice";
import { berlinYear, type IssuedDocument } from "@/lib/billing/issue";
import type { InvoiceParty } from "@/lib/billing/issuer";
import { parseVatId, vatPrefixFor } from "@/lib/tax/vat-id";

// Correcting an issued document. An invoice or credit note is never edited: it is cancelled by a document of its own that
// repeats it with every amount reversed (the Storno), and a new document with the corrected details takes its place. Both
// take the next numbers of the series, so the numbering stays gapless and the books show what was issued, cancelled and
// reissued. Only details of the parties can be corrected here (name, address, VAT ID, tax number): the amounts and the tax
// treatment were derived from the frozen deal and stay as they are.

export type PartySide = "issuer" | "recipient";
export type PartyPatch = { name?: string; addressLines?: string[]; vatId?: string | null; taxNumber?: string | null };
export type CorrectionPatch = Partial<Record<PartySide, PartyPatch>>;

const NAME_MAX = 200;
const LINES_MAX = 4;
const LINE_MAX = 120;
const TAX_NUMBER_MAX = 40;

const tidy = (value: string) => value.replace(/\s+/g, " ").trim();

type Applied = { ok: true; party: InvoiceParty } | { ok: false; error: string };

// The party with the corrected details. Whatever the patch leaves out stays. The country stays too: the tax treatment was
// derived from it.
export function applyPartyPatch(party: InvoiceParty, patch: PartyPatch): Applied {
  const next: InvoiceParty = { ...party, addressLines: [...party.addressLines] };
  if (patch.name !== undefined) {
    const name = tidy(patch.name);
    if (name.length < 2 || name.length > NAME_MAX) return { ok: false, error: `The name needs 2 to ${NAME_MAX} characters.` };
    next.name = name;
  }
  if (patch.addressLines !== undefined) {
    const lines = patch.addressLines.map(tidy).filter(Boolean);
    if (lines.length < 1 || lines.length > LINES_MAX || lines.some((line) => line.length > LINE_MAX)) {
      return { ok: false, error: `The address needs 1 to ${LINES_MAX} lines of up to ${LINE_MAX} characters.` };
    }
    next.addressLines = lines;
  }
  if (patch.vatId !== undefined) {
    const raw = (patch.vatId ?? "").trim();
    if (raw === "") {
      next.vatId = null;
    } else {
      const parsed = parseVatId(raw);
      if (!parsed.ok) return { ok: false, error: "The VAT ID isn't well-formed." };
      if (parsed.vatId.prefix !== vatPrefixFor(party.country)) return { ok: false, error: "The VAT ID has to be from the country on the document." };
      next.vatId = parsed.vatId.normalized;
    }
  }
  if (patch.taxNumber !== undefined) {
    const raw = tidy(patch.taxNumber ?? "");
    if (raw.length > TAX_NUMBER_MAX) return { ok: false, error: `The tax number can have up to ${TAX_NUMBER_MAX} characters.` };
    next.taxNumber = raw === "" ? null : raw;
  }
  return { ok: true, party: next };
}

export type InvoiceSource = Pick<
  Invoice,
  | "id"
  | "number"
  | "kind"
  | "status"
  | "dealId"
  | "recipientUserId"
  | "currency"
  | "issuedAt"
  | "servicePeriodStart"
  | "servicePeriodEnd"
  | "netCents"
  | "vatCents"
  | "grossCents"
  | "vatRateBp"
  | "taxTreatment"
  | "legalNote"
  | "issuer"
  | "recipient"
  | "lines"
  | "cancelsInvoiceId"
  | "cancelledAt"
>;

// A document before it gets its number and its place in the deal's sequence of revisions.
export type NewDocument = Omit<Prisma.InvoiceUncheckedCreateInput, "number" | "revision" | "cancelsInvoiceId" | "status" | "cancelledAt" | "cancelReason">;

export type CorrectionPlan = { ok: true; cancellation: NewDocument; replacement: NewDocument } | { ok: false; error: string };

const KIND_WORD: Record<InvoiceKind, string> = { BRAND_INVOICE: "Rechnung", CREATOR_CREDIT_NOTE: "Gutschrift" };

const berlinDate = (date: Date) => date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });

const hasIdentification = (party: InvoiceParty) => Boolean(party.vatId || party.taxNumber);

// The two documents a correction writes. Pure, so every rule can be tested without a database.
export function planCorrection(original: InvoiceSource, patch: CorrectionPatch, now: Date): CorrectionPlan {
  if (original.status !== "ISSUED" || original.cancelledAt || original.cancelsInvoiceId) {
    return { ok: false, error: "This document can't be corrected: it is already cancelled, or it is itself a cancellation." };
  }
  const before = { issuer: original.issuer as unknown as InvoiceParty, recipient: original.recipient as unknown as InvoiceParty };
  const issuer = applyPartyPatch(before.issuer, patch.issuer ?? {});
  if (!issuer.ok) return issuer;
  const recipient = applyPartyPatch(before.recipient, patch.recipient ?? {});
  if (!recipient.ok) return recipient;

  // An issuer that had a VAT ID or tax number keeps one (§ 14 Abs. 4 Nr. 2 UStG), and a reverse-charge invoice needs the
  // brand's VAT ID, since the brand's tax office is told who owes the VAT.
  if (hasIdentification(before.issuer) && !hasIdentification(issuer.party)) return { ok: false, error: "The issuer needs a VAT ID or a tax number on the document." };
  if (original.kind === "BRAND_INVOICE" && original.taxTreatment === "REVERSE_CHARGE_EU" && !recipient.party.vatId) {
    return { ok: false, error: "An invoice without VAT (reverse charge) needs the brand's VAT ID." };
  }
  if (JSON.stringify(issuer.party) === JSON.stringify(before.issuer) && JSON.stringify(recipient.party) === JSON.stringify(before.recipient)) {
    return { ok: false, error: "Nothing was changed." };
  }

  const body = parseBody(original.lines);
  const reversed = negateBody(body);
  const reversedAmounts = { netCents: 0 - original.netCents, vatCents: 0 - original.vatCents, grossCents: 0 - original.grossCents };
  if (!amountsAddUp(original, body) || !amountsAddUp(reversedAmounts, reversed)) return { ok: false, error: "The document does not add up." };

  const reference = `${KIND_WORD[original.kind]} ${original.number} vom ${berlinDate(original.issuedAt)}`;
  const shared = {
    kind: original.kind,
    dealId: original.dealId,
    recipientUserId: original.recipientUserId,
    currency: original.currency,
    issuedAt: now,
    servicePeriodStart: original.servicePeriodStart,
    servicePeriodEnd: original.servicePeriodEnd,
    vatRateBp: original.vatRateBp,
    taxTreatment: original.taxTreatment,
    legalNote: original.legalNote,
  } satisfies Partial<NewDocument>;

  return {
    ok: true,
    cancellation: {
      ...shared,
      ...reversedAmounts,
      issuer: original.issuer as Prisma.InputJsonValue,
      recipient: original.recipient as Prisma.InputJsonValue,
      lines: { items: reversed.items, notes: [`Storno zu ${reference}.`] } as unknown as Prisma.InputJsonValue,
    },
    replacement: {
      ...shared,
      netCents: original.netCents,
      vatCents: original.vatCents,
      grossCents: original.grossCents,
      issuer: issuer.party as unknown as Prisma.InputJsonValue,
      recipient: recipient.party as unknown as Prisma.InputJsonValue,
      lines: { items: body.items, notes: [...body.notes, `Dieser Beleg ersetzt die ${reference}.`] } as unknown as Prisma.InputJsonValue,
    },
  };
}

export type CorrectionResult =
  | { ok: true; dealId: string; replacedNumber: string; cancellation: IssuedDocument; replacement: IssuedDocument }
  | { ok: false; error: string };

class AlreadyCorrected extends Error {}

// Cancels an issued document and issues its replacement, in one transaction: either both documents exist afterwards, or
// nothing changed and no number was used.
export async function correctInvoice(args: { invoiceId: string; reason: string; patch: CorrectionPatch; now?: Date }): Promise<CorrectionResult> {
  const now = args.now ?? new Date();
  const original = await prisma.invoice.findUnique({ where: { id: args.invoiceId } });
  if (!original) return { ok: false, error: "This document doesn't exist." };
  const plan = planCorrection(original, args.patch, now);
  if (!plan.ok) return plan;
  const year = berlinYear(now);

  try {
    return await prisma.$transaction(async (tx) => {
      // Whoever gets here first cancels it; a second correction of the same document finds it taken.
      const claimed = await tx.invoice.updateMany({
        where: { id: original.id, status: "ISSUED", cancelledAt: null },
        data: { status: "CANCELLED", cancelledAt: now, cancelReason: args.reason },
      });
      if (claimed.count !== 1) throw new AlreadyCorrected();

      const { _max } = await tx.invoice.aggregate({ where: { dealId: original.dealId, kind: original.kind }, _max: { revision: true } });
      const firstRevision = (_max.revision ?? 0) + 1;
      const write = async (document: NewDocument, revision: number, cancelsInvoiceId: string | null) => {
        const sequence = await tx.invoiceSequence.upsert({
          where: { key: invoiceSequenceKey(original.kind, year) },
          create: { key: invoiceSequenceKey(original.kind, year), lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        });
        const created = await tx.invoice.create({
          data: { ...document, number: formatInvoiceNumber(original.kind, year, sequence.lastNumber), revision, cancelsInvoiceId },
        });
        return { id: created.id, kind: created.kind, number: created.number, recipientUserId: created.recipientUserId } satisfies IssuedDocument;
      };
      const cancellation = await write(plan.cancellation, firstRevision, original.id);
      const replacement = await write(plan.replacement, firstRevision + 1, null);
      return { ok: true as const, dealId: original.dealId, replacedNumber: original.number, cancellation, replacement };
    });
  } catch (err) {
    if (err instanceof AlreadyCorrected) return { ok: false, error: "This document was corrected in the meantime." };
    throw err;
  }
}
