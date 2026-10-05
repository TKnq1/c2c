import { afterEach, describe, expect, it, vi } from "vitest";
import { outreachOptOutMatches, outreachOptOutToken } from "@/lib/outreach-opt-out";

describe("outreachOptOutToken", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the token it just made and rejects a different one", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const token = outreachOptOutToken("Mia@Example.com", "CREATOR");
    expect(outreachOptOutMatches("mia@example.com", "CREATOR", token)).toBe(true);
    expect(outreachOptOutMatches("mia@example.com", "STARTUP", token)).toBe(false);
    expect(outreachOptOutMatches("mia@example.com", "CREATOR", `${token}x`)).toBe(false);
  });
});
