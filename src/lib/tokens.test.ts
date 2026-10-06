import { describe, expect, it } from "vitest";
import { hashToken, newToken } from "@/lib/tokens";

describe("tokens", () => {
  it("makes 256-bit hex tokens that differ every time", () => {
    const a = newToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(newToken()).not.toBe(a);
  });

  it("hashes deterministically and never returns the token itself", () => {
    const token = newToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).not.toBe(token);
  });
});
