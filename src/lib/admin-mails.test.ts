import { describe, expect, it } from "vitest";
import { bySubject } from "@/lib/admin-mails";

describe("bySubject", () => {
  it("counts sends and failures per subject, most sent first", () => {
    expect(
      bySubject([
        { subject: "B", ok: true },
        { subject: "A", ok: true },
        { subject: "A", ok: false },
        { subject: "A", ok: true },
      ]),
    ).toEqual([
      { subject: "A", count: 3, failed: 1 },
      { subject: "B", count: 1, failed: 0 },
    ]);
  });
});
