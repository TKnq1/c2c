import { describe, expect, it } from "vitest";
import { berlinQuarterRange, buildInvoicesCsv, buildZmCsv, invoiceTotals, zmLines, type InvoiceRow } from "@/lib/export-invoices";

function row(over: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    number: "RE-2026-000001",
    kind: "BRAND_INVOICE",
    status: "ISSUED",
    issuedAt: new Date("2026-10-08T10:00:00Z"),
    servicePeriodStart: new Date("2026-10-01T00:00:00Z"),
    servicePeriodEnd: new Date("2026-10-07T00:00:00Z"),
    issuerName: "Max Muster (comtor)",
    issuerVatId: "DE123456789",
    recipientName: "Glow GmbH",
    recipientCountry: "DE",
    recipientVatId: null,
    taxTreatment: "DOMESTIC_VAT",
    netCents: 100_000,
    vatRateBp: 1900,
    vatCents: 19_000,
    grossCents: 119_000,
    cancelsNumber: null,
    dealId: "deal_1",
    ...over,
  };
}

const generatedAt = new Date("2026-11-02T09:00:00Z");

describe("berlinQuarterRange", () => {
  it("runs from midnight on the first day of the quarter to midnight on the first day of the next", () => {
    // Summer time ends on 25 October 2026, so the quarter starts at 22:00 UTC the evening before (CEST) and ends at 23:00 UTC (CET).
    expect(berlinQuarterRange("2026-Q4")).toEqual({ start: new Date("2026-09-30T22:00:00Z"), end: new Date("2026-12-31T23:00:00Z") });
    expect(berlinQuarterRange("2026-Q1")).toEqual({ start: new Date("2025-12-31T23:00:00Z"), end: new Date("2026-03-31T22:00:00Z") });
  });

  it("refuses anything that is not a quarter", () => {
    for (const bad of ["", "2026-Q5", "2026-Q0", "2026-4", "26-Q1", "2026-q1", "2026-Q1x"]) expect(berlinQuarterRange(bad)).toBeNull();
  });
});

describe("buildInvoicesCsv", () => {
  it("writes one line per document in the shape German spreadsheets open", () => {
    const csv = buildInvoicesCsv([row()], "2026-10", generatedAt);
    expect(csv.startsWith("﻿Belegnummer;Art;Datum;")).toBe(true);
    expect(csv).toContain("\r\n");
    const line = csv.split("\r\n")[1];
    expect(line).toBe("RE-2026-000001;Rechnung;08.10.2026;01.10.2026;07.10.2026;Max Muster (comtor);DE123456789;Glow GmbH;DE;;Inland, mit USt;1000,00;19;190,00;1190,00;Ausgestellt;;deal_1");
  });

  it("labels credit notes and cancellations, and points a cancellation at its document", () => {
    const csv = buildInvoicesCsv(
      [
        row({ number: "GS-2026-000001", kind: "CREATOR_CREDIT_NOTE", taxTreatment: "REVERSE_CHARGE_13B", vatRateBp: 0, vatCents: 0, netCents: 90_000, grossCents: 90_000 }),
        row({ number: "RE-2026-000002", cancelsNumber: "RE-2026-000001", netCents: -100_000, vatCents: -19_000, grossCents: -119_000 }),
        row({ number: "GS-2026-000002", kind: "CREATOR_CREDIT_NOTE", cancelsNumber: "GS-2026-000001", netCents: -90_000, grossCents: -90_000, vatCents: 0 }),
      ],
      "2026-10",
      generatedAt,
    );
    expect(csv).toContain("GS-2026-000001;Gutschrift;");
    expect(csv).toContain("Reverse Charge § 13b UStG");
    expect(csv).toContain("RE-2026-000002;Stornorechnung;");
    expect(csv).toContain("GS-2026-000002;Stornogutschrift;");
    expect(csv).toContain(";Ausgestellt;RE-2026-000001;deal_1");
    expect(csv).toContain("-1000,00;19;-190,00;-1190,00");
  });

  it("shows a cancelled document as cancelled and nets it out against its cancellation in the sums", () => {
    const rows = [row({ status: "CANCELLED" }), row({ number: "RE-2026-000002", cancelsNumber: "RE-2026-000001", netCents: -100_000, vatCents: -19_000, grossCents: -119_000 }), row({ number: "RE-2026-000003" })];
    const csv = buildInvoicesCsv(rows, "2026-10", generatedAt);
    expect(csv).toContain(";Storniert;;deal_1");
    expect(csv).toContain("Rechnungen inkl. Stornos, netto;1000,00");
    expect(csv).toContain("Rechnungen inkl. Stornos, USt;190,00");
    expect(csv).toContain("Rechnungen inkl. Stornos, brutto;1190,00");
    expect(csv).toContain("Gutschriften inkl. Stornos, netto;0,00");
    expect(invoiceTotals(rows).invoices.grossCents).toBe(119_000);
  });

  it("groups the invoices by tax treatment", () => {
    const csv = buildInvoicesCsv(
      [row(), row({ number: "RE-2026-000002", taxTreatment: "REVERSE_CHARGE_EU", vatCents: 0, vatRateBp: 0, grossCents: 100_000, recipientCountry: "AT", recipientVatId: "ATU12345678" })],
      "2026-10",
      generatedAt,
    );
    expect(csv).toContain("Inland, mit USt;1000,00");
    expect(csv).toContain("Reverse Charge EU (Art. 196 MwStSystRL);1000,00");
  });

  it("never lets a name run as a spreadsheet formula, and quotes what holds a semicolon", () => {
    const csv = buildInvoicesCsv([row({ recipientName: "=HYPERLINK(\"http://evil\")", issuerName: "A; B" })], "2026-10", generatedAt);
    expect(csv).toContain("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csv).toContain("\"A; B\"");
  });

  it("is a valid file for a month without any document", () => {
    const csv = buildInvoicesCsv([], "2026-09", generatedAt);
    expect(csv).toContain("Summen im Monat 2026-09");
    expect(csv).toContain("Rechnungen inkl. Stornos, netto;0,00");
  });
});

describe("zmLines", () => {
  const eu = (over: Partial<InvoiceRow> = {}) => row({ taxTreatment: "REVERSE_CHARGE_EU", vatCents: 0, vatRateBp: 0, grossCents: 100_000, recipientCountry: "AT", recipientVatId: "ATU12345678", ...over });

  it("adds up the services per customer VAT ID, rounded to full euros", () => {
    const lines = zmLines([eu(), eu({ number: "RE-2026-000002", netCents: 50_050, grossCents: 50_050 }), eu({ number: "RE-2026-000003", recipientCountry: "FR", recipientVatId: "FR12345678901", netCents: 20_000, grossCents: 20_000 })]);
    expect(lines).toEqual([
      { country: "AT", vatNumber: "U12345678", exactCents: 150_050, reportedEuros: 1501, documents: 2 },
      { country: "FR", vatNumber: "12345678901", exactCents: 20_000, reportedEuros: 200, documents: 1 },
    ]);
  });

  it("nets a cancelled document out, so a corrected invoice is reported once", () => {
    const lines = zmLines([eu({ status: "CANCELLED" }), eu({ number: "RE-2026-000002", cancelsNumber: "RE-2026-000001", netCents: -100_000, grossCents: -100_000 }), eu({ number: "RE-2026-000003" })]);
    expect(lines).toEqual([{ country: "AT", vatNumber: "U12345678", exactCents: 100_000, reportedEuros: 1000, documents: 3 }]);
  });

  it("leaves out a customer whose documents cancel each other, and everything that is not a reverse-charge invoice", () => {
    expect(zmLines([eu(), eu({ number: "RE-2026-000002", cancelsNumber: "RE-2026-000001", netCents: -100_000, grossCents: -100_000 })])).toEqual([]);
    expect(zmLines([row(), eu({ kind: "CREATOR_CREDIT_NOTE" }), eu({ taxTreatment: "OUT_OF_SCOPE" })])).toEqual([]);
  });

  it("reads a VAT ID however it was typed, and keeps Greece's EL", () => {
    const lines = zmLines([eu({ recipientVatId: "at u 123.456.78" }), eu({ number: "RE-2026-000002", recipientCountry: "GR", recipientVatId: "EL123456789" })]);
    expect(lines.map((l) => `${l.country}${l.vatNumber}`)).toEqual(["ATU12345678", "EL123456789"]);
  });
});

describe("buildZmCsv", () => {
  it("lists the customers with the amount to report and the sum", () => {
    const csv = buildZmCsv(
      [row({ taxTreatment: "REVERSE_CHARGE_EU", vatCents: 0, vatRateBp: 0, grossCents: 100_050, netCents: 100_050, recipientCountry: "AT", recipientVatId: "ATU12345678" })],
      "2026-Q4",
      generatedAt,
    );
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("﻿Land;USt-IdNr. des Leistungsempfängers;Sonstige Leistungen (EUR, exakt);Meldebetrag (volle EUR);Belege");
    expect(lines[1]).toBe("AT;U12345678;1000,50;1001;1");
    expect(csv).toContain("Summe im Quartal 2026-Q4;;1000,50;1001");
    expect(csv).toContain("BZSt-Online-Portal");
  });

  it("is a valid file for a quarter without such services", () => {
    const csv = buildZmCsv([], "2026-Q3", generatedAt);
    expect(csv).toContain("Summe im Quartal 2026-Q3;;0,00;0");
  });
});
