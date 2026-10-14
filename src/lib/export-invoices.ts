import type { InvoiceKind, InvoiceStatus, TaxTreatment } from "@prisma/client";
import { BOM, berlinMonthRange, csvCell, day, euros } from "@/lib/export-payments";

// The documents of the platform for the tax advisor, in the same shape as the payments export (semicolons, decimal commas, UTF-8
// with a marker): one line per invoice, credit note or cancellation issued in a month, and the summary of the services sold to
// businesses in other EU countries (the Zusammenfassende Meldung). Pure: the rows are loaded elsewhere.

export type InvoiceRow = {
  number: string;
  kind: InvoiceKind;
  status: InvoiceStatus;
  issuedAt: Date;
  servicePeriodStart: Date | null;
  servicePeriodEnd: Date | null;
  issuerName: string;
  issuerVatId: string | null;
  recipientName: string;
  recipientCountry: string;
  recipientVatId: string | null;
  taxTreatment: TaxTreatment;
  netCents: number;
  vatRateBp: number;
  vatCents: number;
  grossCents: number;
  // The number of the document this one cancels (a cancellation only).
  cancelsNumber: string | null;
  dealId: string;
};

const KIND: Record<InvoiceKind, string> = { BRAND_INVOICE: "Rechnung", CREATOR_CREDIT_NOTE: "Gutschrift" };
const kindLabel = (row: Pick<InvoiceRow, "kind" | "cancelsNumber">) => (row.cancelsNumber ? `Storno${KIND[row.kind].toLowerCase()}` : KIND[row.kind]);

export const TAX_LABEL: Record<TaxTreatment, string> = {
  DOMESTIC_VAT: "Inland, mit USt",
  REVERSE_CHARGE_EU: "Reverse Charge EU (Art. 196 MwStSystRL)",
  REVERSE_CHARGE_13B: "Reverse Charge § 13b UStG",
  OUT_OF_SCOPE: "Nicht steuerbar (Drittland)",
  SMALL_BUSINESS_EXEMPT: "Kleinunternehmer (§ 19 UStG)",
};

const STATUS: Record<InvoiceStatus, string> = { ISSUED: "Ausgestellt", CANCELLED: "Storniert" };

const HEAD = [
  "Belegnummer",
  "Art",
  "Datum",
  "Leistung von",
  "Leistung bis",
  "Aussteller",
  "Aussteller USt-IdNr.",
  "Empfänger",
  "Empfänger Land",
  "Empfänger USt-IdNr.",
  "Steuerbehandlung",
  "Netto (EUR)",
  "USt-Satz (%)",
  "USt (EUR)",
  "Brutto (EUR)",
  "Status",
  "Storno zu",
  "Deal",
];

const sum = (rows: InvoiceRow[], pick: (row: InvoiceRow) => number) => rows.reduce((total, row) => total + pick(row), 0);

// Cancellations carry negative amounts, so a plain sum already nets a cancelled document out against its cancellation.
export function invoiceTotals(rows: InvoiceRow[]) {
  const of = (kind: InvoiceKind) => {
    const own = rows.filter((row) => row.kind === kind);
    return { netCents: sum(own, (r) => r.netCents), vatCents: sum(own, (r) => r.vatCents), grossCents: sum(own, (r) => r.grossCents) };
  };
  const byTreatment = new Map<TaxTreatment, number>();
  for (const row of rows.filter((r) => r.kind === "BRAND_INVOICE")) byTreatment.set(row.taxTreatment, (byTreatment.get(row.taxTreatment) ?? 0) + row.netCents);
  return { invoices: of("BRAND_INVOICE"), creditNotes: of("CREATOR_CREDIT_NOTE"), byTreatment };
}

export function buildInvoicesCsv(rows: InvoiceRow[], month: string, generatedAt: Date): string {
  const sorted = [...rows].sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime() || a.number.localeCompare(b.number));
  const lines = [HEAD.map(csvCell).join(";")];
  for (const r of sorted) {
    lines.push(
      [
        csvCell(r.number),
        kindLabel(r),
        day(r.issuedAt),
        day(r.servicePeriodStart),
        day(r.servicePeriodEnd),
        csvCell(r.issuerName),
        csvCell(r.issuerVatId ?? ""),
        csvCell(r.recipientName),
        csvCell(r.recipientCountry),
        csvCell(r.recipientVatId ?? ""),
        TAX_LABEL[r.taxTreatment],
        euros(r.netCents),
        String(r.vatRateBp / 100).replace(".", ","),
        euros(r.vatCents),
        euros(r.grossCents),
        STATUS[r.status],
        csvCell(r.cancelsNumber ?? ""),
        csvCell(r.dealId),
      ].join(";"),
    );
  }
  const totals = invoiceTotals(sorted);
  lines.push(
    "",
    ["Summen im Monat " + month, ""].map(csvCell).join(";"),
    `Rechnungen inkl. Stornos, netto;${euros(totals.invoices.netCents)}`,
    `Rechnungen inkl. Stornos, USt;${euros(totals.invoices.vatCents)}`,
    `Rechnungen inkl. Stornos, brutto;${euros(totals.invoices.grossCents)}`,
    `Gutschriften inkl. Stornos, netto;${euros(totals.creditNotes.netCents)}`,
    `Gutschriften inkl. Stornos, USt;${euros(totals.creditNotes.vatCents)}`,
    `Gutschriften inkl. Stornos, brutto;${euros(totals.creditNotes.grossCents)}`,
    "",
    "Rechnungen nach Steuerbehandlung (netto)",
    ...[...totals.byTreatment].sort(([a], [b]) => a.localeCompare(b)).map(([treatment, cents]) => `${TAX_LABEL[treatment]};${euros(cents)}`),
    "",
    csvCell(`Stand ${generatedAt.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}. Beträge in Euro. Ein stornierter Beleg steht mit seinem Storno-Beleg in der Liste: beide zusammen ergeben null. Keine Steuerberatung.`),
  );
  return BOM + lines.join("\r\n") + "\r\n";
}

// A calendar quarter in German time, "2026-Q4": from midnight on the first day of its first month up to midnight on the first
// day of the next quarter.
export function berlinQuarterRange(quarter: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-Q([1-4])$/.exec(quarter);
  if (!match) return null;
  const year = Number(match[1]);
  const first = (Number(match[2]) - 1) * 3 + 1;
  const start = berlinMonthRange(`${year}-${String(first).padStart(2, "0")}`);
  const end = first === 10 ? berlinMonthRange(`${year + 1}-01`) : berlinMonthRange(`${year}-${String(first + 3).padStart(2, "0")}`);
  return start && end ? { start: start.start, end: end.start } : null;
}

export type ZmLine = { country: string; vatNumber: string; exactCents: number; reportedEuros: number; documents: number };

// The services the platform sold to businesses in other EU countries, where the customer owes the VAT: per customer VAT ID, what
// the Zusammenfassende Meldung asks for. Cancellations count with their negative amounts, so a corrected invoice shows once.
export function zmLines(rows: InvoiceRow[]): ZmLine[] {
  const groups = new Map<string, ZmLine>();
  for (const row of rows) {
    if (row.kind !== "BRAND_INVOICE" || row.taxTreatment !== "REVERSE_CHARGE_EU") continue;
    const id = (row.recipientVatId ?? "").toUpperCase().replace(/[\s.\-_/]/g, "");
    const country = id.slice(0, 2);
    const key = id || "ohne USt-IdNr.";
    const line = groups.get(key) ?? { country, vatNumber: id.slice(2), exactCents: 0, reportedEuros: 0, documents: 0 };
    line.exactCents += row.netCents;
    line.documents += 1;
    groups.set(key, line);
  }
  return [...groups.values()]
    .filter((line) => line.exactCents !== 0)
    .map((line) => ({ ...line, reportedEuros: Math.round(line.exactCents / 100) }))
    .sort((a, b) => a.country.localeCompare(b.country) || a.vatNumber.localeCompare(b.vatNumber));
}

export function buildZmCsv(rows: InvoiceRow[], quarter: string, generatedAt: Date): string {
  const lines = [["Land", "USt-IdNr. des Leistungsempfängers", "Sonstige Leistungen (EUR, exakt)", "Meldebetrag (volle EUR)", "Belege"].map(csvCell).join(";")];
  const entries = zmLines(rows);
  for (const entry of entries) lines.push([csvCell(entry.country), csvCell(entry.vatNumber), euros(entry.exactCents), String(entry.reportedEuros), String(entry.documents)].join(";"));
  lines.push(
    "",
    `Summe im Quartal ${quarter};;${euros(entries.reduce((total, e) => total + e.exactCents, 0))};${entries.reduce((total, e) => total + e.reportedEuros, 0)}`,
    "",
    csvCell(
      `Stand ${generatedAt.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}. Nur Rechnungen mit Steuerschuld beim Leistungsempfänger in einem anderen EU-Land (Reverse Charge EU), inklusive Stornos. Eine Zeile je USt-IdNr., der Meldebetrag ist auf volle Euro gerundet. Die Zusammenfassende Meldung gibst du selbst im BZSt-Online-Portal ab, oder dein Steuerberater tut es. Keine Steuerberatung.`,
    ),
  );
  return BOM + lines.join("\r\n") + "\r\n";
}
