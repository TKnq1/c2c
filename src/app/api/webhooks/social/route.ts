import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST_FORMATS, isPostFormat } from "@/lib/social/platforms";
import { socialEventSchema, verifySignature } from "@/lib/social/webhook";
import { markPostPublished, markPostRemoved } from "@/lib/deals/verification";

// Events about posts from a metrics provider (or a relay in front of the platforms' own APIs): a post's numbers, its
// publication, its removal. The sender signs the raw body with SOCIAL_WEBHOOK_SECRET. Without the secret every delivery is
// refused, so the endpoint is inert until it is switched on on purpose. Matched to a deal post by platform and external id.
export async function POST(req: Request) {
  const body = await req.text();
  if (!verifySignature(body, req.headers.get("x-comtor-signature"), process.env.SOCIAL_WEBHOOK_SECRET?.trim())) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = socialEventSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const event = parsed.data;

  const candidates = await prisma.dealPost.findMany({
    where: { externalId: event.externalId, status: { in: ["PENDING", "VERIFIED", "UNREACHABLE"] } },
    select: { id: true, format: true },
  });
  const posts = candidates.filter((p) => isPostFormat(p.format) && POST_FORMATS[p.format].platform === event.platform);
  if (posts.length === 0) return NextResponse.json({ received: true, matched: 0 });

  const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();
  for (const post of posts) {
    if (event.type === "post.metrics" && event.metrics) {
      // The event id is unique: a retry of the same delivery is stored once.
      await prisma.dealPostMetric
        .create({ data: { postId: post.id, capturedAt: occurredAt, source: "webhook", eventId: `${event.eventId}:${post.id}`, ...event.metrics } })
        .catch((err: { code?: string }) => {
          if (err.code !== "P2002") throw err;
        });
    } else if (event.type === "post.removed") {
      await markPostRemoved(post.id, occurredAt);
    } else if (event.type === "post.published") {
      await markPostPublished(post.id, occurredAt);
    }
  }
  return NextResponse.json({ received: true, matched: posts.length });
}
