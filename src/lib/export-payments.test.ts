import { describe, expect, it } from "vitest";
import { berlinMonthRange, buildPaymentsCsv, csvCell, paymentTotals, type PaymentRow } from "@/lib/export-payments";

const row = (over: Partial<PaymentRow>): PaymentRow => ({
  request: "Fashion Drop",
  brand: "StyleHub",
  creator: "Sara",
  status: "RELEASED",
  amountCents: 30000,
  feeCents: 3000,
  payoutCents: 27000,
  paidAt: new Date("2026-10-02T10:00:00Z"),
  releasedAt: new Date("2026-10-06T10:00:00Z"),
  refundedAt: null,
  chargeId: "ch_1",
  transferId: "tr_1",
  refundId: null,
  ...over,
});

describe("berlinMonthRange", () => {
  it("runs from midnight to midnight in German time, summer and winter", () => {
    const october = berlinMonthRange("2026-10")!;
    expect(october.start.toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(october.end.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(berlinMonthRange("2026-12")!.end.toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });

  it("rejects anything that is not a month", () => {
    expect(berlinMonthRange("2026-13")).toBeNull();
    expect(berlinMonthRange("oktober")).toBeNull();
    expect(berlinMonthRange("2026-1")).toBeNull();
  });
});

describe("csvCell", () => {
  it("quotes delimiters and quotes, and turns formula starts into text", () => {
    expect(csvCell("Mode; Beauty")).toBe('"Mode; Beauty"');
    expect(csvCell('Sie sagt "hi"')).toBe('"Sie sagt ""hi"""');
    expect(csvCell("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+49 30")).toBe("'+49 30");
    expect(csvCell("Normal")).toBe("Normal");
  });
});

describe("buildPaymentsCsv", () => {
  const range = berlinMonthRange("2026-10")!;
  const rows = [row({}), row({ request: "Food Box", status: "REFUNDED", amountCents: 40000, feeCents: null, payoutCents: null, releasedAt: null, refundedAt: new Date("2026-10-09T08:00:00Z"), refundId: "re_1" })];

  it("writes German-style rows and sums", () => {
    const csv = buildPaymentsCsv(rows, "2026-10", range, new Date("2026-11-02T08:00:00Z"));
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("02.10.2026;06.10.2026;;Fashion Drop;StyleHub;Sara;Ausgezahlt;300,00;30,00;270,00;ch_1;tr_1;");
    expect(csv).toContain("09.10.2026;Food Box;StyleHub;Sara;Erstattet;400,00");
    expect(csv).toContain("Zahlungseingänge (brutto);700,00");
    expect(csv).toContain("Provision aus Freigaben;30,00");
    expect(csv).toContain("Erstattungen;400,00");
    expect(csv.split("\r\n")[0]).toBe("\uFEFFZahlung eingegangen;Freigabe;Erstattung;Anfrage;Marke;Creator;Status;Brutto (EUR);Provision (EUR);Auszahlung an Creator (EUR);Stripe Charge;Stripe Transfer;Stripe Erstattung");
  });

  it("counts only what happened inside the month", () => {
    const earlier = row({ paidAt: new Date("2026-09-15T10:00:00Z"), releasedAt: new Date("2026-10-03T10:00:00Z") });
    expect(paymentTotals([earlier], range)).toEqual({ receivedCents: 0, feeCents: 3000, payoutCents: 27000, refundedCents: 0 });
  });
});
