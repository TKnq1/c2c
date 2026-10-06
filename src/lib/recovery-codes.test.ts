import { describe, expect, it } from "vitest";
import { generateRecoveryCodes } from "@/lib/recovery-codes";

describe("generateRecoveryCodes", () => {
  it("makes ten distinct 80-bit codes in four groups", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) expect(code).toMatch(/^[0-9A-F]{5}(-[0-9A-F]{5}){3}$/);
  });
});
