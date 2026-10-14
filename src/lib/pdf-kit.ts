import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// What the platform's PDFs (invoices, contracts) are built from: a page builder that places text with word wrap and page breaks,
// and a renderer that draws the result with pdf-lib's standard fonts. The layout never touches a font itself: it asks the
// metrics for the width of a text and for the characters the font can print, so it can be tested without reading a PDF back.

export type Metrics = {
  width: (text: string, size: number, bold: boolean) => number;
  // The text with every character the font cannot print replaced by something it can.
  clean: (text: string) => string;
};

export type PdfOp =
  | { kind: "text"; page: number; x: number; y: number; text: string; size: number; bold: boolean; color: "ink" | "grey" | "red"; align: "left" | "right" | "center" }
  | { kind: "line"; page: number; x1: number; x2: number; y: number; thickness: number };

export type PdfLayout = { pages: number; ops: PdfOp[] };

export const PAGE = { width: 595.28, height: 841.89, margin: 50, bottom: 52 } as const;
export const RIGHT = PAGE.width - PAGE.margin;
export const CONTENT_WIDTH = PAGE.width - 2 * PAGE.margin;

// Characters outside the standard fonts' alphabet (Windows-1252) are the accented letters of other languages: drop the accent when
// the plain letter is printable, and write a question mark for what is left, rather than fail to print a creator's name.
const TRANSLITERATE: Record<string, string> = { "Ł": "L", "ł": "l", "Đ": "D", "đ": "d", "Ø": "O", "ø": "o", "Æ": "AE", "æ": "ae", "ı": "i", "İ": "I", "−": "-", "‑": "-", " ": " ", " ": " " };

export function printable(text: string, canPrint: (codePoint: number) => boolean): string {
  let out = "";
  for (const char of text.normalize("NFC")) {
    const codePoint = char.codePointAt(0)!;
    if (codePoint === 0x0a || codePoint === 0x0d || codePoint === 0x09) {
      out += " ";
      continue;
    }
    if (canPrint(codePoint)) {
      out += char;
      continue;
    }
    const plain = TRANSLITERATE[char] ?? char.normalize("NFD").replace(/[̀-ͯ]/g, "");
    out += plain && [...plain].every((c) => canPrint(c.codePointAt(0)!)) ? plain : "?";
  }
  return out;
}

export const lead = (size: number) => Math.round(size * 1.4 * 10) / 10;

// "DE" as "Deutschland", for the address blocks.
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["de"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

type TextOptions = { bold?: boolean; color?: "ink" | "grey" | "red"; align?: "left" | "right" | "center" };

// Places text from the top of the first page downwards. `top` is the distance from the top edge in points; the operations it
// writes use the PDF's own coordinates (from the bottom edge).
export class PageBuilder {
  readonly ops: PdfOp[] = [];
  page = 1;
  top: number = PAGE.margin;

  constructor(private readonly metrics: Metrics) {}

  wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const paragraph of this.metrics.clean(text).split(/\s*\n\s*/)) {
      let line = "";
      for (const word of paragraph.split(/ +/).filter(Boolean)) {
        const attempt = line ? `${line} ${word}` : word;
        if (this.metrics.width(attempt, size, bold) <= maxWidth) {
          line = attempt;
          continue;
        }
        if (line) lines.push(line);
        // A word wider than the line (a long URL, a hash, a company name without spaces) is cut where it no longer fits.
        let rest = word;
        while (this.metrics.width(rest, size, bold) > maxWidth && rest.length > 1) {
          let cut = rest.length - 1;
          while (cut > 1 && this.metrics.width(rest.slice(0, cut), size, bold) > maxWidth) cut -= 1;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
      lines.push(line);
    }
    return lines;
  }

  // Starts a new page when `height` does not fit on this one.
  room(height: number) {
    if (this.top + height > PAGE.height - PAGE.bottom) {
      this.page += 1;
      this.top = PAGE.margin;
    }
  }

  text(value: string, x: number, size: number, options: TextOptions = {}) {
    this.ops.push({
      kind: "text",
      page: this.page,
      x,
      y: PAGE.height - (this.top + size),
      text: this.metrics.clean(value),
      size,
      bold: options.bold ?? false,
      color: options.color ?? "ink",
      align: options.align ?? "left",
    });
  }

  rule(thickness = 0.6, x1: number = PAGE.margin, x2: number = RIGHT) {
    this.ops.push({ kind: "line", page: this.page, x1, x2, y: PAGE.height - this.top, thickness });
  }

  // Wrapped paragraphs one under the other; returns where the text ended.
  paragraph(value: string, x: number, size: number, maxWidth: number, options: TextOptions = {}): number {
    for (const line of this.wrap(value, size, options.bold ?? false, maxWidth)) {
      this.room(lead(size));
      this.text(line, x, size, options);
      this.top += lead(size);
    }
    return this.top;
  }

  // The footer of every page, now that the number of pages is known.
  finish(footer: (page: number, pages: number) => string): PdfLayout {
    for (let n = 1; n <= this.page; n += 1) {
      this.ops.push({ kind: "text", page: n, x: PAGE.width / 2, y: 28, text: this.metrics.clean(footer(n, this.page)), size: 8, bold: false, color: "grey", align: "center" });
    }
    return { pages: this.page, ops: this.ops };
  }
}

const COLORS = { ink: rgb(0.03, 0.03, 0.03), grey: rgb(0.4, 0.4, 0.4), red: rgb(0.7, 0.1, 0.1) } as const;

// Lays out and draws a document. `date` is the date of the document, not of the rendering: the same document always gives the
// same file.
export async function renderPdf(meta: { title: string; date: Date }, build: (metrics: Metrics) => PdfLayout): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const printableSet = new Set(regular.getCharacterSet());

  pdf.setTitle(meta.title);
  pdf.setSubject(meta.title);
  pdf.setAuthor("comtor");
  pdf.setCreator("comtor");
  pdf.setProducer("comtor");
  pdf.setCreationDate(meta.date);
  pdf.setModificationDate(meta.date);

  const metrics: Metrics = {
    width: (text, size, isBold) => (isBold ? bold : regular).widthOfTextAtSize(text, size),
    clean: (text) => printable(text, (codePoint) => printableSet.has(codePoint)),
  };
  const layout = build(metrics);
  const pages = Array.from({ length: layout.pages }, () => pdf.addPage([PAGE.width, PAGE.height]));

  for (const op of layout.ops) {
    const target = pages[op.page - 1];
    if (op.kind === "line") {
      target.drawLine({ start: { x: op.x1, y: op.y }, end: { x: op.x2, y: op.y }, thickness: op.thickness, color: COLORS.grey });
      continue;
    }
    const font = op.bold ? bold : regular;
    const width = font.widthOfTextAtSize(op.text, op.size);
    const x = op.align === "right" ? op.x - width : op.align === "center" ? op.x - width / 2 : op.x;
    target.drawText(op.text, { x, y: op.y, size: op.size, font, color: COLORS[op.color] });
  }
  return pdf.save({ useObjectStreams: false });
}
