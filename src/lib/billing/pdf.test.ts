import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { PAGE, documentTitle, layoutInvoice, printable, renderInvoicePdf, type Metrics, type PdfInvoice, type PdfOp } from "@/lib/billing/pdf";
import type { InvoiceParty } from "@/lib/billing/issuer";
import { formatCents } from "@/lib/format";

const platform: InvoiceParty = { name: "Max Muster (comtor)", addressLines: ["Musterstraße 1", "10115 Berlin"], country: "DE", vatId: "DE123456789", taxNumber: null };
const brand: InvoiceParty = { name: "Glow GmbH", addressLines: ["Teststraße 1", "10115 Berlin"], country: "DE", vatId: null, taxNumber: "12/345/67890" };

function invoice(over: Partial<PdfInvoice> = {}): PdfInvoice {
  return {
    number: "RE-2026-000001",
    kind: "BRAND_INVOICE",
    status: "ISSUED",
    issuedAt: new Date("2026-10-08T22:30:00Z"),
    servicePeriodStart: new Date("2026-10-01T00:00:00Z"),
    servicePeriodEnd: new Date("2026-10-08T00:00:00Z"),
    netCents: 100_000,
    vatCents: 19_000,
    grossCents: 119_000,
    vatRateBp: 1900,
    legalNote: null,
    issuer: platform as never,
    recipient: brand as never,
    lines: { items: [{ description: "Influencer-Kooperation „Herbst“: TikTok Video", quantity: 1, unitNetCents: 100_000, netCents: 100_000 }], notes: [] } as never,
    cancelsInvoiceId: null,
    cancelledAt: null,
    ...over,
  };
}

// Every character is 5 points wide at size 10: enough to check wrapping and page breaks without a font.
const fake: Metrics = { width: (text, size) => text.length * size * 0.5, clean: (text) => text };

const texts = (ops: PdfOp[], page?: number) => ops.filter((op): op is Extract<PdfOp, { kind: "text" }> => op.kind === "text" && (page === undefined || op.page === page));
const lines = (ops: PdfOp[], page?: number) => texts(ops, page).map((op) => op.text);

describe("documentTitle", () => {
  it("names the four kinds of document", () => {
    expect(documentTitle({ kind: "BRAND_INVOICE", cancelsInvoiceId: null })).toBe("Rechnung");
    expect(documentTitle({ kind: "CREATOR_CREDIT_NOTE", cancelsInvoiceId: null })).toBe("Gutschrift");
    expect(documentTitle({ kind: "BRAND_INVOICE", cancelsInvoiceId: "inv_1" })).toBe("Stornorechnung");
    expect(documentTitle({ kind: "CREATOR_CREDIT_NOTE", cancelsInvoiceId: "inv_1" })).toBe("Stornogutschrift");
  });
});

describe("printable", () => {
  const winAnsi = (codePoint: number) => (codePoint >= 0x20 && codePoint <= 0x7e) || [0xe4, 0xf6, 0xfc, 0xdf, 0xc4, 0xd6, 0xdc, 0xa0, 0x20ac, 0x201e, 0x201c, 0x2013, 0x161].includes(codePoint);

  it("keeps what the font can print", () => {
    expect(printable("Müller & Söhne GmbH – „Herbst“ 119,00 €", winAnsi)).toBe("Müller & Söhne GmbH – „Herbst“ 119,00 €");
  });

  it("drops the accent of a letter the font does not have, and writes a question mark for the rest", () => {
    expect(printable("Łukasz Wiśniewski", winAnsi)).toBe("Lukasz Wisniewski");
    expect(printable("Café Čech", winAnsi)).toBe("Cafe Cech");
    expect(printable("Studio 😀 Sun", winAnsi)).toBe("Studio ? Sun");
    expect(printable("Мария", winAnsi)).toBe("?????");
  });

  it("writes a minus sign and line breaks as the font knows them", () => {
    expect(printable("−119,00 €", winAnsi)).toBe("-119,00 €");
    expect(printable("a\nb\tc", winAnsi)).toBe("a b c");
  });
});

describe("layoutInvoice", () => {
  it("puts the title, the number, the dates and both parties on the page", () => {
    const { ops, pages } = layoutInvoice(invoice(), fake);
    expect(pages).toBe(1);
    const all = lines(ops);
    expect(all).toContain("Rechnung");
    expect(all).toContain("Nr. RE-2026-000001");
    // 22:30 UTC on 8 October is 9 October in Berlin.
    expect(all).toContain("Datum: 09.10.2026");
    expect(all).toContain("Leistungszeitraum: 01.10.2026 – 08.10.2026");
    expect(all).toEqual(expect.arrayContaining(["Max Muster (comtor)", "Musterstraße 1", "10115 Berlin", "Deutschland", "USt-IdNr. DE123456789", "Glow GmbH", "Steuernr. 12/345/67890"]));
    expect(all).toContain("comtor · RE-2026-000001 · Seite 1 von 1");
  });

  it("writes the items and the totals with the amounts right-aligned", () => {
    const { ops } = layoutInvoice(invoice(), fake);
    const right = texts(ops).filter((op) => op.align === "right");
    // formatCents writes a no-break space before the euro sign; the PDF keeps it (the font has it).
    expect(right.map((op) => op.text)).toEqual(expect.arrayContaining(["1", formatCents(100_000), formatCents(19_000), formatCents(119_000)]));
    expect(lines(ops)).toEqual(expect.arrayContaining(["Netto", "USt. 19 %", "Gesamt"]));
  });

  it("calls the total of a credit note the payout", () => {
    const { ops } = layoutInvoice(invoice({ kind: "CREATOR_CREDIT_NOTE", issuer: brand as never, recipient: platform as never }), fake);
    expect(lines(ops)).toContain("Auszahlungsbetrag");
    expect(lines(ops)).toContain("Gutschrift");
  });

  it("shows a document without VAT as such, with its legal sentence and notes", () => {
    const legal = "Steuerschuldnerschaft des Leistungsempfängers (Reverse-Charge-Verfahren, Art. 196 MwStSystRL).";
    const { ops } = layoutInvoice(invoice({ vatCents: 0, grossCents: 100_000, vatRateBp: 0, legalNote: legal, lines: { items: [{ description: "x", quantity: 1, unitNetCents: 100_000, netCents: 100_000 }], notes: ["Zahlbar über Stripe."] } as never }), fake);
    const all = lines(ops).join(" ");
    expect(lines(ops)).toContain("USt.");
    expect(all).toContain("Steuerschuldnerschaft des");
    expect(lines(ops)).toContain("Zahlbar über Stripe.");
  });

  it("shows a cancellation with its negative amounts, and a cancelled original as cancelled", () => {
    const storno = layoutInvoice(
      invoice({ cancelsInvoiceId: "inv_1", netCents: -100_000, vatCents: -19_000, grossCents: -119_000, lines: { items: [{ description: "x", quantity: 1, unitNetCents: -100_000, netCents: -100_000 }], notes: ["Storno zu Rechnung RE-2026-000001 vom 09.10.2026."] } as never }),
      fake,
    );
    expect(lines(storno.ops)).toContain("Stornorechnung");
    expect(lines(storno.ops)).toContain(formatCents(-119_000));
    expect(formatCents(-119_000)).toMatch(/^-1\.190,00/);
    expect(lines(storno.ops)).toContain("Storno zu Rechnung RE-2026-000001 vom 09.10.2026.");

    const cancelled = layoutInvoice(invoice({ status: "CANCELLED", cancelledAt: new Date("2026-10-20T08:00:00Z") }), fake);
    expect(lines(cancelled.ops)).toContain("STORNIERT am 20.10.2026");
    expect(lines(layoutInvoice(invoice(), fake).ops).some((line) => line.startsWith("STORNIERT"))).toBe(false);
  });

  it("wraps a long description and cuts a word that is wider than the line", () => {
    const long = `Influencer-Kooperation ${"mit einer sehr langen Beschreibung ".repeat(6)}`.trim();
    const wrapped = layoutInvoice(invoice({ lines: { items: [{ description: long, quantity: 1, unitNetCents: 100_000, netCents: 100_000 }], notes: [] } as never }), fake);
    const description = texts(wrapped.ops).filter((op) => op.x === PAGE.margin && op.size === 10 && long.includes(op.text));
    expect(description.length).toBeGreaterThan(2);
    expect(description.map((op) => op.text).join(" ")).toBe(long);

    const word = "x".repeat(200);
    const cut = layoutInvoice(invoice({ lines: { items: [{ description: word, quantity: 1, unitNetCents: 1, netCents: 100_000 }], notes: [] } as never }), fake);
    const pieces = texts(cut.ops).filter((op) => /^x+$/.test(op.text));
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.map((op) => op.text).join("")).toBe(word);
    for (const piece of pieces) expect(fake.width(piece.text, 10, false)).toBeLessThanOrEqual(PAGE.width);
  });

  it("starts a new page when the items do not fit, and numbers every page", () => {
    const items = Array.from({ length: 70 }, (_, i) => ({ description: `Position ${i + 1}`, quantity: 1, unitNetCents: 1000, netCents: 1000 }));
    const { ops, pages } = layoutInvoice(invoice({ netCents: 70_000, vatCents: 13_300, grossCents: 83_300, lines: { items, notes: ["Am Ende."] } as never }), fake);
    expect(pages).toBeGreaterThan(1);
    for (let page = 1; page <= pages; page += 1) expect(lines(ops, page)).toContain(`comtor · RE-2026-000001 · Seite ${page} von ${pages}`);
    // Nothing runs off the page, and every position is there exactly once.
    for (const op of texts(ops)) {
      expect(op.y).toBeGreaterThan(0);
      expect(op.y).toBeLessThan(PAGE.height);
    }
    expect(lines(ops).filter((line) => /^Position \d+$/.test(line))).toHaveLength(70);
    // The totals stay together on the last page.
    expect(lines(ops, pages)).toEqual(expect.arrayContaining(["Netto", "Gesamt", "Am Ende."]));
  });
});

describe("renderInvoicePdf", () => {
  it("makes a PDF with the title of the document", async () => {
    const bytes = await renderInvoicePdf(invoice());
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toBe("Rechnung RE-2026-000001");
    expect(pdf.getAuthor()).toBe("comtor");
    expect(pdf.getCreationDate()?.toISOString()).toBe("2026-10-08T22:30:00.000Z");
  });

  it("gives the same file for the same document", async () => {
    expect(Buffer.from(await renderInvoicePdf(invoice())).equals(Buffer.from(await renderInvoicePdf(invoice())))).toBe(true);
  });

  it("prints a name with letters the font does not have instead of failing", async () => {
    const odd: InvoiceParty = { ...brand, name: "Łukasz Wiśniewski Studio 😀 Мария" };
    const bytes = await renderInvoicePdf(invoice({ recipient: odd as never }));
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });

  it("runs onto more pages for a long document", async () => {
    const items = Array.from({ length: 70 }, (_, i) => ({ description: `Position ${i + 1}: eine Beschreibung, die lang genug ist`, quantity: 1, unitNetCents: 1000, netCents: 1000 }));
    const bytes = await renderInvoicePdf(invoice({ netCents: 70_000, vatCents: 13_300, grossCents: 83_300, lines: { items, notes: [] } as never }));
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);
  });
});
