import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { layoutContract, renderContractPdf, type ContractPdfInput } from "@/lib/deals/contract-pdf";
import { snapshotFixture, termsFixture } from "@/lib/deals/contract-fixture.test-helper";
import { PAGE, type Metrics, type PdfOp } from "@/lib/pdf-kit";
import { formatCents } from "@/lib/format";

// Every character is 5 points wide at size 10: enough to check the layout without a font.
const fake: Metrics = { width: (text, size) => text.length * size * 0.5, clean: (text) => text };

const HASH = "a3f1c2d4e5b60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

function input(over: Partial<ContractPdfInput> = {}): ContractPdfInput {
  return {
    dealId: "cmv0deal1",
    termsHash: HASH,
    terms: termsFixture(),
    snapshot: snapshotFixture(),
    viewer: "STARTUP",
    payoutCents: 90_000,
    feeCents: 10_000,
    createdAt: new Date("2026-10-08T10:00:00Z"),
    brandSignedAt: new Date("2026-10-08T12:30:00Z"),
    creatorSignedAt: new Date("2026-10-08T11:00:00Z"),
    ...over,
  };
}

const texts = (ops: PdfOp[], page?: number) => ops.filter((op): op is Extract<PdfOp, { kind: "text" }> => op.kind === "text" && (page === undefined || op.page === page));
const lines = (ops: PdfOp[], page?: number) => texts(ops, page).map((op) => op.text);

describe("layoutContract", () => {
  it("names the contract, the deal and the fingerprint of the terms", () => {
    const { ops, pages } = layoutContract(input(), fake);
    expect(pages).toBe(1);
    const all = lines(ops).join(" ");
    expect(all).toContain("Kooperationsvertrag");
    expect(lines(ops)).toContain("Autumn launch");
    expect(all).toContain("Vertrags-ID: cmv0deal1");
    // The hash is wider than the line in the fake font and is cut, but all of it is there.
    expect(all.replace(/ /g, "")).toContain(HASH);
    expect(lines(ops)).toContain("comtor · Vertrag cmv0deal1 · Seite 1 von 1");
  });

  it("prints the brand its own money and the counterpart's name only", () => {
    const { ops } = layoutContract(input({ viewer: "STARTUP" }), fake);
    const all = lines(ops);
    expect(all).toContain("Glow Cosmetics GmbH");
    expect(all).toContain("Teststraße 1");
    expect(all).toContain("Deutschland");
    expect(all).toContain("Steuernr. 12/345/67890");
    // The creator's name as in the terms, but not the legal name, address or tax number.
    expect(all).toContain("Mia");
    expect(all).not.toContain("Mia Summers");
    expect(all).not.toContain("Linienstraße 5");
    expect(all).not.toContain("Steuernr. 98/765/43210");
    expect(all.some((line) => line.includes(formatCents(119_000)))).toBe(true);
    expect(all.some((line) => line.includes(formatCents(90_000)))).toBe(false);
  });

  it("prints the creator the other way round", () => {
    const { ops } = layoutContract(input({ viewer: "CREATOR" }), fake);
    const all = lines(ops);
    expect(all).toContain("Mia Summers");
    expect(all).toContain("Linienstraße 5");
    expect(all).not.toContain("Teststraße 1");
    expect(all.some((line) => line.includes(formatCents(90_000)))).toBe(true);
    expect(all.some((line) => line.includes(formatCents(119_000)))).toBe(false);
  });

  it("prints an admin everything", () => {
    const all = lines(layoutContract(input({ viewer: "ADMIN" }), fake).ops);
    expect(all).toEqual(expect.arrayContaining(["Glow Cosmetics GmbH", "Mia Summers", "Teststraße 1", "Linienstraße 5"]));
    expect(all.some((line) => line.includes(formatCents(119_000)))).toBe(true);
    expect(all.some((line) => line.includes(formatCents(90_000)))).toBe(true);
  });

  it("lists the terms and the briefing's own words", () => {
    const all = lines(layoutContract(input(), fake).ops);
    expect(all).toEqual(expect.arrayContaining(["Preis (netto)", "Werbekennzeichnung", "Werbung / Anzeige", "Ablauf", "Posting-Fenster", "20. Okt. 2026 – 20. Nov. 2026", "Nutzungsrechte", "Kernbotschaften", "Bitte vermeiden"]));
    // The check mark of the screen is written as a word, since the PDF's font has no check mark.
    expect(all).toContain("Ja");
    expect(all).not.toContain("✓");
    expect(all.join(" ")).toContain("Show the texture and mention the code GLOW10.");
  });

  it("says who confirmed the contract and when, and who has not yet", () => {
    const signed = lines(layoutContract(input(), fake).ops).join(" ");
    expect(signed).toContain("Bestätigt von Glow am 8. Okt. 2026, 14:30");
    expect(signed).toContain("Bestätigt von Mia am 8. Okt. 2026, 13:00");

    const open = lines(layoutContract(input({ creatorSignedAt: null, snapshot: null }), fake).ops).join(" ");
    expect(open).toContain("Noch nicht bestätigt von Mia");
    expect(open).toContain(de("contract.vatPending"));
  });

  it("flows onto more pages for a long briefing, and keeps everything on the page", () => {
    const long = Array.from({ length: 60 }, (_, i) => `Satz ${i + 1} der Kernbotschaften mit etwas mehr Text.`).join(" ");
    const { ops, pages } = layoutContract(input({ terms: termsFixture({ talkingPoints: long, doNots: long }) }), fake);
    expect(pages).toBeGreaterThan(1);
    for (const op of texts(ops)) {
      expect(op.y).toBeGreaterThan(0);
      expect(op.y).toBeLessThan(PAGE.height);
    }
    for (let page = 1; page <= pages; page += 1) expect(lines(ops, page)).toContain(`comtor · Vertrag cmv0deal1 · Seite ${page} von ${pages}`);
    expect(lines(ops, pages).join(" ")).toContain("Bestätigt von");
  });
});

function de(key: "contract.vatPending") {
  return key === "contract.vatPending" ? "Die USt. wird festgelegt, sobald beide bestätigt haben, anhand beider Geschäftsprofile." : key;
}

describe("renderContractPdf", () => {
  it("makes a PDF with the title and the date of the deal", async () => {
    const bytes = await renderContractPdf(input());
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toBe("Kooperationsvertrag Autumn launch");
    expect(pdf.getCreationDate()?.toISOString()).toBe("2026-10-08T10:00:00.000Z");
  });

  it("gives the same file for the same contract", async () => {
    expect(Buffer.from(await renderContractPdf(input())).equals(Buffer.from(await renderContractPdf(input())))).toBe(true);
  });
});
