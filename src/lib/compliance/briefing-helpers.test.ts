import { describe, expect, it } from "vitest";
import { addTags, deadlineFor, eurosToCents, removeTag, splitTags } from "@/lib/compliance/briefing-helpers";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0);

describe("deadlineFor", () => {
  it("counts two weeks and thirty days from today", () => {
    expect(deadlineFor("in2weeks", day(2026, 10, 9))).toBe("2026-10-23");
    expect(deadlineFor("in30days", day(2026, 10, 9))).toBe("2026-11-08");
  });

  it("takes the end of this month, or of the next one when it is under a week away", () => {
    expect(deadlineFor("endOfMonth", day(2026, 10, 9))).toBe("2026-10-31");
    expect(deadlineFor("endOfMonth", day(2026, 10, 28))).toBe("2026-11-30");
  });

  it("rolls over a year end", () => {
    expect(deadlineFor("in30days", day(2026, 12, 20))).toBe("2027-01-19");
  });
});

describe("tags", () => {
  it("splits on spaces and commas, drops # and @, and keeps each tag once", () => {
    expect(splitTags("glowco #herbst, @glow  Herbst")).toEqual(["glowco", "herbst", "glow"]);
    expect(splitTags(undefined)).toEqual([]);
  });

  it("adds what was typed and removes a tag", () => {
    expect(addTags("glowco", "#herbst winter")).toBe("glowco herbst winter");
    expect(removeTag("glowco herbst", "Herbst")).toBe("glowco");
  });
});

describe("eurosToCents", () => {
  it("reads commas and points, and treats anything else as zero", () => {
    expect(eurosToCents("180")).toBe(18000);
    expect(eurosToCents("180,50")).toBe(18050);
    expect(eurosToCents("abc")).toBe(0);
    expect(eurosToCents("-5")).toBe(0);
  });
});
