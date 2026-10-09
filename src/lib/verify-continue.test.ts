import { describe, expect, it } from "vitest";
import { verifyContinueTarget } from "@/lib/verify-continue";

describe("verifyContinueTarget", () => {
  it("sends a brand on to posting a request", () => {
    expect(verifyContinueTarget("STARTUP").href).toBe("/dashboard/startup/new");
  });

  it("sends a creator to the feed", () => {
    expect(verifyContinueTarget("CREATOR").href).toBe("/dashboard/creator");
  });

  it("falls back to the dashboard", () => {
    expect(verifyContinueTarget(undefined).href).toBe("/dashboard");
    expect(verifyContinueTarget("ADMIN").href).toBe("/dashboard");
  });
});
