import { describe, expect, it } from "vitest";
import { hashOutreachEmail } from "@/lib/outreach-suppression";

describe("hashOutreachEmail", () => {
  it("is the same for any spelling of one address", () => {
    expect(hashOutreachEmail("  Mia@Example.com ")).toBe(hashOutreachEmail("mia@example.com"));
  });

  it("differs between addresses and never contains the address", () => {
    const hash = hashOutreachEmail("mia@example.com");
    expect(hash).not.toBe(hashOutreachEmail("jo@example.com"));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("mia");
  });
});
