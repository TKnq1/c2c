import { describe, expect, it } from "vitest";
import { pct } from "@/lib/admin-growth";

describe("pct", () => {
  it("rounds to a whole percent and gives null for an empty whole", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
    expect(pct(0, 0)).toBeNull();
  });
});
