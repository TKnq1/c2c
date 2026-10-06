import { afterEach, describe, expect, it, vi } from "vitest";
import { outreachEnabled } from "@/lib/outreach-enabled";

describe("outreachEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off unless OUTREACH_ENABLED is exactly 1", () => {
    expect(outreachEnabled()).toBe(false);
    vi.stubEnv("OUTREACH_ENABLED", "true");
    expect(outreachEnabled()).toBe(false);
    vi.stubEnv("OUTREACH_ENABLED", "1");
    expect(outreachEnabled()).toBe(true);
  });
});
