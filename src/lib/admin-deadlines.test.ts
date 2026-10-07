import { describe, expect, it } from "vitest";
import { RELEASE_REVIEW_MS } from "@/lib/constants";
import { releaseAt, turnaroundMs } from "@/lib/admin-deadlines";

describe("releaseAt", () => {
  it("adds the review window to the day the post was submitted", () => {
    const submitted = new Date("2026-10-01T10:00:00Z");
    expect(releaseAt(submitted).getTime() - submitted.getTime()).toBe(RELEASE_REVIEW_MS);
  });
});

describe("turnaroundMs", () => {
  it("is the median wait between filing and closing, and null without closed reports", () => {
    expect(turnaroundMs([])).toBeNull();
    const h = 3600_000;
    const base = new Date("2026-10-01T00:00:00Z");
    const at = (hours: number) => new Date(base.getTime() + hours * h);
    expect(
      turnaroundMs([
        { filed: base, closed: at(2) },
        { filed: base, closed: at(10) },
        { filed: base, closed: at(4) },
      ]),
    ).toBe(4 * h);
  });
});
