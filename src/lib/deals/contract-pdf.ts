import type { InvoiceParty } from "@/lib/billing/issuer";
import { CONTENT_WIDTH, PAGE, PageBuilder, countryName, lead, renderPdf, type Metrics, type PdfLayout } from "@/lib/pdf-kit";
import { contractView } from "@/lib/deals/contract-rows";
import { formatDealDate } from "@/lib/deals/notices";
import type { TaxSnapshot } from "@/lib/deals/parties";
import type { DealTerms } from "@/lib/deals/terms";
import { uiText } from "@/lib/deals/ui-copy";

// The contract of a deal as a PDF: the terms as they were frozen when the offer was accepted, with the fingerprint that ties this
// document to exactly that version and the moments both sides confirmed it. German, like the invoices. A side sees its own money
// (see contract-rows.ts) and the counterpart's name only; an admin sees everything.

export type ContractPdfInput = {
  dealId: string;
  termsHash: string;
  terms: DealTerms;
  snapshot: TaxSnapshot | null;
  viewer: "STARTUP" | "CREATOR" | "ADMIN";
  payoutCents: number;
  feeCents: number;
  createdAt: Date;
  brandSignedAt: Date | null;
  creatorSignedAt: Date | null;
};

const LABEL_WIDTH = 150;
const VALUE_X = PAGE.margin + LABEL_WIDTH + 10;
const VALUE_WIDTH = CONTENT_WIDTH - LABEL_WIDTH - 10;
const COLUMN_WIDTH = 235;

const day = (date: Date) => date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });

export function layoutContract(input: ContractPdfInput, metrics: Metrics): PdfLayout {
  const u = uiText("de");
  const { terms, snapshot, viewer } = input;
  const b = new PageBuilder(metrics);

  b.text("Kooperationsvertrag", PAGE.margin, 22, { bold: true });
  b.top += 34;
  b.paragraph(terms.requestTitle, PAGE.margin, 13, CONTENT_WIDTH, { bold: true });
  b.top += 4;
  b.paragraph(`${u("contract.termsId")}: ${input.dealId}`, PAGE.margin, 9.5, CONTENT_WIDTH, { color: "grey" });
  b.paragraph(`Prüfsumme (SHA-256) der bestätigten Fassung: ${input.termsHash}`, PAGE.margin, 8.5, CONTENT_WIDTH, { color: "grey" });
  b.paragraph(`Angelegt am ${day(input.createdAt)}`, PAGE.margin, 9.5, CONTENT_WIDTH, { color: "grey" });
  b.top += 14;

  // The parties side by side. A side's address and tax IDs are only printed for the side itself and for an admin.
  const party = (label: string, name: string, side: "STARTUP" | "CREATOR", details: InvoiceParty | undefined, x: number): number => {
    const start = b.top;
    b.text(label, x, 8.5, { color: "grey" });
    b.top += lead(8.5);
    const draw = (value: string, size: number, bold = false) => {
      for (const line of b.wrap(value, size, bold, COLUMN_WIDTH)) {
        b.text(line, x, size, { bold });
        b.top += lead(size);
      }
    };
    draw(details && (viewer === side || viewer === "ADMIN") ? details.name : name, 10.5, true);
    if (details && (viewer === side || viewer === "ADMIN")) {
      for (const line of details.addressLines) draw(line, 10);
      draw(countryName(details.country), 10);
      if (details.vatId) draw(`USt-IdNr. ${details.vatId}`, 9.5);
      if (details.taxNumber) draw(`Steuernr. ${details.taxNumber}`, 9.5);
    }
    const end = b.top;
    b.top = start;
    return end;
  };
  b.room(110);
  const leftEnd = party("Marke", terms.brandName, "STARTUP", snapshot?.brand, PAGE.margin);
  const rightEnd = party("Creator", terms.creatorName, "CREATOR", snapshot?.creator, PAGE.margin + CONTENT_WIDTH - COLUMN_WIDTH);
  b.top = Math.max(leftEnd, rightEnd) + 18;

  const view = contractView({ terms, snapshot, viewer, payoutCents: input.payoutCents, feeCents: input.feeCents, u, locale: "de" });
  b.text("Bedingungen", PAGE.margin, 11, { bold: true });
  b.top += lead(11) + 2;
  b.rule(0.8);
  b.top += 6;
  for (const row of view.rows) {
    if (row.kind === "pending") {
      b.paragraph(row.text, PAGE.margin, 9, CONTENT_WIDTH, { color: "grey" });
      b.top += 4;
      continue;
    }
    // The check mark of the screen is not in the font the PDF is written in.
    const lines = b.wrap(row.value === "✓" ? "Ja" : row.value, 10, false, VALUE_WIDTH);
    const labelLines = b.wrap(row.label, 9.5, false, LABEL_WIDTH);
    const height = Math.max(lines.length * lead(10), labelLines.length * lead(9.5));
    b.room(height + 10);
    const rowTop = b.top;
    labelLines.forEach((line) => {
      b.text(line, PAGE.margin, 9.5, { color: "grey" });
      b.top += lead(9.5);
    });
    b.top = rowTop;
    for (const line of lines) {
      b.text(line, VALUE_X, 10);
      b.top += lead(10);
    }
    b.top = rowTop + height + 3;
    b.rule(0.3);
    b.top += 5;
  }

  for (const note of view.notes) {
    b.top += 6;
    b.room(lead(10) * 2);
    b.text(`${note.label}`, PAGE.margin, 9.5, { bold: true });
    b.top += lead(9.5);
    b.paragraph(note.value, PAGE.margin, 10, CONTENT_WIDTH);
  }

  // Who confirmed, and when.
  b.top += 12;
  b.room(84);
  b.text("Bestätigung", PAGE.margin, 11, { bold: true });
  b.top += lead(11) + 2;
  b.rule(0.8);
  b.top += 6;
  for (const [name, signedAt] of [
    [terms.brandName, input.brandSignedAt],
    [terms.creatorName, input.creatorSignedAt],
  ] as const) {
    b.paragraph(signedAt ? `${u("contract.signedBy", { name })} am ${formatDealDate(signedAt, "de")}` : u("contract.notSigned", { name }), PAGE.margin, 10, CONTENT_WIDTH, signedAt ? {} : { color: "red" });
  }
  b.top += 10;
  b.paragraph(
    "Dieses Dokument gibt die Bedingungen so wieder, wie sie in comtor bestätigt wurden. Es gehört zur Prüfsumme oben: Ändert sich eine Bedingung, ändert sich die Prüfsumme.",
    PAGE.margin,
    8.5,
    CONTENT_WIDTH,
    { color: "grey" },
  );

  return b.finish((page, pages) => `comtor · Vertrag ${input.dealId} · Seite ${page} von ${pages}`);
}

export function renderContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  return renderPdf({ title: `Kooperationsvertrag ${input.terms.requestTitle}`, date: input.createdAt }, (metrics) => layoutContract(input, metrics));
}
