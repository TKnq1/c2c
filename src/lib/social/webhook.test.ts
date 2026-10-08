import { describe, expect, it } from "vitest";
import { signBody, socialEventSchema, verifySignature } from "@/lib/social/webhook";

describe("verifySignature", () => {
  const body = JSON.stringify({ eventId: "e1" });

  it("accepts the signature made with the shared secret", () => {
    expect(verifySignature(body, signBody(body, "s3cret"), "s3cret")).toBe(true);
  });

  it("rejects a wrong secret, a changed body, a missing header and an unset secret", () => {
    expect(verifySignature(body, signBody(body, "other"), "s3cret")).toBe(false);
    expect(verifySignature(`${body} `, signBody(body, "s3cret"), "s3cret")).toBe(false);
    expect(verifySignature(body, null, "s3cret")).toBe(false);
    expect(verifySignature(body, signBody(body, "s3cret"), undefined)).toBe(false);
    expect(verifySignature(body, "sha256=abc", "s3cret")).toBe(false);
  });
});

describe("socialEventSchema", () => {
  it("accepts a metrics event", () => {
    const parsed = socialEventSchema.safeParse({
      eventId: "evt_1",
      type: "post.metrics",
      platform: "TikTok",
      externalId: "7412345678901234567",
      occurredAt: "2026-10-08T10:00:00Z",
      metrics: { views: 1000, likes: 50 },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown platforms, negative numbers and missing ids", () => {
    expect(socialEventSchema.safeParse({ eventId: "e", type: "post.metrics", platform: "Facebook", externalId: "1" }).success).toBe(false);
    expect(socialEventSchema.safeParse({ eventId: "e", type: "post.metrics", platform: "TikTok", externalId: "1", metrics: { views: -1 } }).success).toBe(false);
    expect(socialEventSchema.safeParse({ type: "post.removed", platform: "TikTok", externalId: "1" }).success).toBe(false);
  });
});
