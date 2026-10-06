import { describe, expect, it } from "vitest";
import { HEARD_FROM, isHeardFrom } from "@/lib/heard-from";

describe("isHeardFrom", () => {
  it("accepts every known code", () => {
    for (const code of HEARD_FROM) expect(isHeardFrom(code)).toBe(true);
  });

  it("refuses anything else", () => {
    for (const value of ["", "Search", "tiktok", "search ", null, undefined, 3, { 0: "search" }]) {
      expect(isHeardFrom(value)).toBe(false);
    }
  });
});
