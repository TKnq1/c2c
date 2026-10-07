import { describe, expect, it } from "vitest";
import { formatNoticeBody, parseNoticeBody } from "@/lib/admin-notice-format";

describe("notice body", () => {
  it("round-trips sections and drops empty ones", () => {
    const body = formatNoticeBody([
      { title: "Was jetzt ansteht", lines: ["2 offene Meldungen", "3 Mails nicht rausgegangen"] },
      { title: "Aufgefallen", lines: [] },
      { title: "Zahlen", lines: ["Nutzer: 19 (+4 diese Woche)"] },
    ]);
    expect(body).toBe("# Was jetzt ansteht\n2 offene Meldungen\n3 Mails nicht rausgegangen\n\n# Zahlen\nNutzer: 19 (+4 diese Woche)");
    expect(parseNoticeBody(body)).toEqual([
      { title: "Was jetzt ansteht", lines: ["2 offene Meldungen", "3 Mails nicht rausgegangen"] },
      { title: "Zahlen", lines: ["Nutzer: 19 (+4 diese Woche)"] },
    ]);
  });

  it("keeps text without a heading as its own section", () => {
    expect(parseNoticeBody("Ein Satz.\nNoch einer.")).toEqual([{ title: null, lines: ["Ein Satz.", "Noch einer."] }]);
  });
});
