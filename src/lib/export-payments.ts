// The monthly payments export for the tax advisor: one CSV a month in the shape German spreadsheet programs open directly
// (semicolons, decimal commas, UTF-8 with a marker so umlauts survive). Pure: the rows are loaded elsewhere.
const ZONE = "Europe/Berlin";
const BOM = "﻿";

export type PaymentRow = {
  request: string;
  brand: string;
  creator: string;
  status: string;
  amountCents: number | null;
  feeCents: number | null;
  payoutCents: number | null;
  paidAt: Date | null;
  releasedAt: Date | null;
  refundedAt: Date | null;
  chargeId: string | null;
  transferId: string | null;
  refundId: string | null;
};

const STATUS: Record<string, string> = { OFFERED: "Angeboten", ACCEPTED: "Angenommen", HELD: "Im Treuhand", RELEASED: "Ausgezahlt", REFUNDED: "Erstattet" };
export const paymentStatusLabel = (status: string | null) => (status ? (STATUS[status] ?? status) : "");

// The offset of Berlin from UTC at an instant, in minutes (60 in winter, 120 in summer).
function berlinOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return (Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - at.getTime()) / 60_000;
}

// A calendar month in German time, "2026-10": from midnight on the 1st up to (not including) midnight on the 1st after.
export function berlinMonthRange(month: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const m = Number(match[2]);
  const midnight = (y: number, mo: number) => {
    const guess = Date.UTC(y, mo - 1, 1);
    return new Date(guess - berlinOffsetMinutes(new Date(guess)) * 60_000);
  };
  return { start: midnight(year, m), end: m === 12 ? midnight(year + 1, 1) : midnight(year, m + 1) };
}

const euros = (cents: number | null) => (cents === null ? "" : (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }));
const day = (d: Date | null) => (d ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: ZONE }) : "");

// One text cell. Quoted when it holds a delimiter, a quote or a line break; a cell that starts like a formula is made text,
// because brands and creators type these names and a spreadsheet would otherwise run them.
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

const HEAD = ["Zahlung eingegangen", "Freigabe", "Erstattung", "Anfrage", "Marke", "Creator", "Status", "Brutto (EUR)", "Provision (EUR)", "Auszahlung an Creator (EUR)", "Stripe Charge", "Stripe Transfer", "Stripe Erstattung"];

export function paymentTotals(rows: PaymentRow[], range: { start: Date; end: Date }) {
  const within = (d: Date | null) => !!d && d >= range.start && d < range.end;
  const sum = (items: (number | null)[]) => items.reduce<number>((total, v) => total + (v ?? 0), 0);
  return {
    receivedCents: sum(rows.filter((r) => within(r.paidAt)).map((r) => r.amountCents)),
    feeCents: sum(rows.filter((r) => within(r.releasedAt) && r.status === "RELEASED").map((r) => r.feeCents)),
    payoutCents: sum(rows.filter((r) => within(r.releasedAt) && r.status === "RELEASED").map((r) => r.payoutCents)),
    refundedCents: sum(rows.filter((r) => within(r.refundedAt)).map((r) => r.amountCents)),
  };
}

export function buildPaymentsCsv(rows: PaymentRow[], month: string, range: { start: Date; end: Date }, generatedAt: Date): string {
  const lines = [HEAD.map(csvCell).join(";")];
  for (const r of rows) {
    lines.push(
      [
        day(r.paidAt),
        day(r.releasedAt),
        day(r.refundedAt),
        csvCell(r.request),
        csvCell(r.brand),
        csvCell(r.creator),
        paymentStatusLabel(r.status),
        euros(r.amountCents),
        euros(r.feeCents),
        euros(r.payoutCents),
        r.chargeId ?? "",
        r.transferId ?? "",
        r.refundId ?? "",
      ].join(";"),
    );
  }
  const t = paymentTotals(rows, range);
  lines.push(
    "",
    ["Summen im Monat " + month, ""].map(csvCell).join(";"),
    `Zahlungseingänge (brutto);${euros(t.receivedCents)}`,
    `Provision aus Freigaben;${euros(t.feeCents)}`,
    `Auszahlungen an Creator;${euros(t.payoutCents)}`,
    `Erstattungen;${euros(t.refundedCents)}`,
    "",
    csvCell(`Stand ${generatedAt.toLocaleString("de-DE", { timeZone: ZONE })}. Beträge in Euro. Ohne Pro-Abos und ohne Kautionen (zurückzahlbare Sicherheit, keine Einnahme): Pro-Abos stehen im Stripe-Export. Keine Steuerberatung.`),
  );
  return BOM + lines.join("\r\n") + "\r\n";
}
