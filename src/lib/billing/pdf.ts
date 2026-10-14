import type { Invoice } from "@prisma/client";
import { formatCents } from "@/lib/format";
import { parseBody } from "@/lib/billing/invoice";
import type { InvoiceParty } from "@/lib/billing/issuer";
import { CONTENT_WIDTH, PAGE, PageBuilder, RIGHT, countryName, lead, renderPdf, type Metrics, type PdfLayout } from "@/lib/pdf-kit";

// An issued invoice or credit note as a PDF. The documents are German (the platform is), and the PDF is the one thing that goes to
// the recipient's accountant, so it is built from what was stored when the document was issued, never from the current profiles.
// layoutInvoice decides what stands where (the kit in src/lib/pdf-kit.ts draws it), so the layout can be tested without a PDF reader.

export { PAGE, printable, type Metrics, type PdfLayout, type PdfOp } from "@/lib/pdf-kit";

export type PdfInvoice = Pick<
  Invoice,
  | "number"
  | "kind"
  | "status"
  | "issuedAt"
  | "servicePeriodStart"
  | "servicePeriodEnd"
  | "netCents"
  | "vatCents"
  | "grossCents"
  | "vatRateBp"
  | "legalNote"
  | "issuer"
  | "recipient"
  | "lines"
  | "cancelsInvoiceId"
  | "cancelledAt"
>;

const COLUMN_WIDTH = 235;
const QTY_RIGHT = 440;

export function documentTitle(invoice: Pick<PdfInvoice, "kind" | "cancelsInvoiceId">): string {
  if (invoice.kind === "BRAND_INVOICE") return invoice.cancelsInvoiceId ? "Stornorechnung" : "Rechnung";
  return invoice.cancelsInvoiceId ? "Stornogutschrift" : "Gutschrift";
}

const day = (date: Date) => date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });

// What stands where. All sizes in points.
export function layoutInvoice(invoice: PdfInvoice, metrics: Metrics): PdfLayout {
  const b = new PageBuilder(metrics);

  b.text(documentTitle(invoice), PAGE.margin, 22, { bold: true });
  b.top += 34;
  b.text(`Nr. ${invoice.number}`, PAGE.margin, 11, { bold: true });
  b.top += lead(11);
  b.text(`Datum: ${day(invoice.issuedAt)}`, PAGE.margin, 10);
  b.top += lead(10);
  if (invoice.servicePeriodStart && invoice.servicePeriodEnd) {
    b.text(`Leistungszeitraum: ${day(invoice.servicePeriodStart)} – ${day(invoice.servicePeriodEnd)}`, PAGE.margin, 10);
    b.top += lead(10);
  }
  if (invoice.status === "CANCELLED") {
    b.text(`STORNIERT${invoice.cancelledAt ? ` am ${day(invoice.cancelledAt)}` : ""}`, PAGE.margin, 10, { bold: true, color: "red" });
    b.top += lead(10);
  }
  b.top += 14;

  // The two parties side by side; the taller one decides where the table starts.
  const party = (label: string, p: InvoiceParty, x: number): number => {
    const start = b.top;
    b.text(label, x, 8.5, { color: "grey" });
    b.top += lead(8.5);
    const draw = (value: string, size: number, bold = false) => {
      for (const line of b.wrap(value, size, bold, COLUMN_WIDTH)) {
        b.text(line, x, size, { bold });
        b.top += lead(size);
      }
    };
    draw(p.name, 10.5, true);
    for (const line of p.addressLines) draw(line, 10);
    draw(countryName(p.country), 10);
    if (p.vatId) draw(`USt-IdNr. ${p.vatId}`, 9.5);
    if (p.taxNumber) draw(`Steuernr. ${p.taxNumber}`, 9.5);
    const end = b.top;
    b.top = start;
    return end;
  };
  b.room(120);
  const leftEnd = party("Von", invoice.issuer as unknown as InvoiceParty, PAGE.margin);
  const rightEnd = party("An", invoice.recipient as unknown as InvoiceParty, PAGE.margin + CONTENT_WIDTH - COLUMN_WIDTH);
  b.top = Math.max(leftEnd, rightEnd) + 18;

  // The items.
  const body = parseBody(invoice.lines);
  b.room(60);
  b.text("Beschreibung", PAGE.margin, 9, { color: "grey" });
  b.text("Menge", QTY_RIGHT, 9, { color: "grey", align: "right" });
  b.text("Netto", RIGHT, 9, { color: "grey", align: "right" });
  b.top += lead(9) + 2;
  b.rule(0.8);
  b.top += 6;
  for (const item of body.items) {
    const lines = b.wrap(item.description, 10, false, QTY_RIGHT - PAGE.margin - 60);
    b.room(lines.length * lead(10) + 10);
    lines.forEach((line, index) => {
      b.text(line, PAGE.margin, 10);
      if (index === 0) {
        b.text(String(item.quantity), QTY_RIGHT, 10, { align: "right" });
        b.text(formatCents(item.netCents), RIGHT, 10, { align: "right" });
      }
      b.top += lead(10);
    });
    b.top += 4;
    b.rule(0.3);
    b.top += 6;
  }

  // The totals.
  const credit = invoice.kind === "CREATOR_CREDIT_NOTE";
  b.room(78);
  b.top += 6;
  const labelX = 340;
  const total = (label: string, value: string, bold = false) => {
    b.text(label, labelX, bold ? 11 : 10, { bold });
    b.text(value, RIGHT, bold ? 11 : 10, { bold, align: "right" });
    b.top += lead(bold ? 11 : 10) + 1;
  };
  total("Netto", formatCents(invoice.netCents));
  total(invoice.vatRateBp > 0 ? `USt. ${invoice.vatRateBp / 100} %` : "USt.", formatCents(invoice.vatCents));
  b.rule(0.8, labelX, RIGHT);
  b.top += 4;
  total(credit ? "Auszahlungsbetrag" : "Gesamt", formatCents(invoice.grossCents), true);
  b.top += 14;

  // The legal sentence for the tax treatment, then the notes.
  const note = (value: string, bold: boolean) => {
    const lines = b.wrap(value, 9, bold, CONTENT_WIDTH);
    b.room(lines.length * lead(9) + 8);
    for (const line of lines) {
      b.text(line, PAGE.margin, 9, { bold, color: bold ? "ink" : "grey" });
      b.top += lead(9);
    }
    b.top += 4;
  };
  if (invoice.legalNote) note(invoice.legalNote, true);
  for (const line of body.notes) note(line, false);

  return b.finish((page, pages) => `comtor · ${invoice.number} · Seite ${page} von ${pages}`);
}

export function renderInvoicePdf(invoice: PdfInvoice): Promise<Uint8Array> {
  return renderPdf({ title: `${documentTitle(invoice)} ${invoice.number}`, date: invoice.issuedAt }, (metrics) => layoutInvoice(invoice, metrics));
}
