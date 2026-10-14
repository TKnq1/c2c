import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// Events from a metrics provider (or our own small relay in front of the platforms' APIs) that report a post's numbers
// or its removal. The sender signs the raw body with SOCIAL_WEBHOOK_SECRET: "x-comtor-signature: sha256=<hex>".

export function signBody(rawBody: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

export function verifySignature(rawBody: string, header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(signBody(rawBody, secret));
  const given = Buffer.from(header.trim());
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const count = z.number().int().min(0).max(10_000_000_000);

export const socialEventSchema = z.object({
  // The provider's id for this event: a retry of the same event is stored once.
  eventId: z.string().min(1).max(200),
  type: z.enum(["post.metrics", "post.removed", "post.published"]),
  platform: z.enum(["Instagram", "TikTok", "YouTube"]),
  externalId: z.string().min(1).max(100),
  occurredAt: z.string().datetime().optional(),
  metrics: z
    .object({ views: count.optional(), likes: count.optional(), comments: count.optional(), shares: count.optional() })
    .optional(),
});

export type SocialEvent = z.infer<typeof socialEventSchema>;
