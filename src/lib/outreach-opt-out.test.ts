import { afterEach, describe, expect, it, vi } from "vitest";
import { outreachListUnsubscribeHeaders, outreachOptOutMatches, outreachOptOutToken } from "@/lib/outreach-opt-out";

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

describe("outreachListUnsubscribeHeaders", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("points the one-click header at the signed API link and asks for a POST", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const headers = outreachListUnsubscribeHeaders("Mia@Example.com", "CREATOR");
    const url = new URL(headers["List-Unsubscribe"].match(/<(https?:[^>]+)>/)![1]);
    expect(url.pathname).toBe("/api/outreach/unsubscribe");
    expect(url.searchParams.get("email")).toBe("mia@example.com");
    expect(outreachOptOutMatches("mia@example.com", "CREATOR", url.searchParams.get("token")!)).toBe(true);
    expect(headers["List-Unsubscribe"]).toContain("mailto:info@comtor.app");
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});
