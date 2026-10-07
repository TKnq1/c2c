import { describe, expect, it } from "vitest";
import { detectColumns, readAdRows } from "@/lib/ad-import";
import { parseCsv, parseDay, parseNumber } from "@/lib/csv-parse";

describe("parseCsv", () => {
  it("reads quoted cells, a semicolon delimiter and a byte-order mark", () => {
    const rows = parseCsv('﻿Tag;Kampagnenname;Ausgegebener Betrag (EUR)\n2026-10-05;"Creator; werben";12,50\n');
    expect(rows).toEqual([["Tag", "Kampagnenname", "Ausgegebener Betrag (EUR)"], ["2026-10-05", "Creator; werben", "12,50"]]);
  });

  it("handles escaped quotes, CRLF and blank lines", () => {
    const rows = parseCsv('a,b\r\n"say ""hi""",2\r\n\r\n');
    expect(rows).toEqual([["a", "b"], ['say "hi"', "2"]]);
  });
});

describe("parseNumber", () => {
  it("understands German and English number formats", () => {
    expect(parseNumber("1.234,56")).toBe(1234.56);
    expect(parseNumber("1,234.56")).toBe(1234.56);
    expect(parseNumber("12,5")).toBe(12.5);
    expect(parseNumber("1,234")).toBe(1234);
    expect(parseNumber("€ 7.30")).toBe(7.3);
    expect(parseNumber("1.234.567")).toBe(1234567);
    expect(parseNumber("n/a")).toBeNull();
  });
});

describe("parseDay", () => {
  it("accepts ISO, dotted and slashed dates and rejects impossible ones", () => {
    expect(parseDay("2026-10-05")).toBe("2026-10-05");
    expect(parseDay("2026-10-05 00:00:00")).toBe("2026-10-05");
    expect(parseDay("05.10.2026")).toBe("2026-10-05");
    expect(parseDay("10/05/2026")).toBe("2026-10-05");
    expect(parseDay("25/12/2026")).toBe("2026-12-25");
    expect(parseDay("2026-02-31")).toBeNull();
    expect(parseDay("gestern")).toBeNull();
  });
});

describe("detectColumns and readAdRows", () => {
  it("maps a German Meta export", () => {
    const rows = parseCsv("Tag,Kampagnenname,Ausgegebener Betrag (EUR),Impressionen,Klicks auf Link\n2026-10-05,Creator werben,12.50,1200,30\n2026-10-06,Creator werben,8.00,900,20\nkaputt,,x,,\n");
    const map = detectColumns(rows[0]);
    expect(map).toEqual({ day: 0, campaign: 1, spend: 2, impressions: 3, clicks: 4 });
    const result = readAdRows(rows, map);
    expect(result.rows).toEqual([
      { day: "2026-10-05", campaignName: "Creator werben", spendCents: 1250, impressions: 1200, clicks: 30 },
      { day: "2026-10-06", campaignName: "Creator werben", spendCents: 800, impressions: 900, clicks: 20 },
    ]);
    expect(result.skipped).toBe(1);
  });

  it("maps an English TikTok export", () => {
    const rows = parseCsv("stat_time_day,campaign_name,spend,impressions,clicks\n2026-10-05 00:00:00,Swipe video,9.09,5000,40\n");
    const map = detectColumns(rows[0]);
    expect(map).toEqual({ day: 0, campaign: 1, spend: 2, impressions: 3, clicks: 4 });
    expect(readAdRows(rows, map).rows[0]).toMatchObject({ day: "2026-10-05", spendCents: 909, clicks: 40 });
  });

  it("reads nothing when a required column is missing", () => {
    const rows = parseCsv("Tag,Betrag\n2026-10-05,5\n");
    expect(readAdRows(rows, detectColumns(rows[0])).rows).toEqual([]);
  });
});
