import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { outreachEventKind, recordOutreachEvent, verifyResendWebhook } from "@/lib/outreach-tracking";

// Resend posts here when a tracked email is opened or its link is clicked.
// The signature is the whole check: without RESEND_WEBHOOK_SECRET nothing
// is recorded. /api/webhooks is outside the auth proxy so the raw body
// stays intact for that check.
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });

  const payload = await req.text();
  const id = req.headers.get("svix-id") ?? req.headers.get("webhook-id");
  const timestamp = req.headers.get("svix-timestamp") ?? req.headers.get("webhook-timestamp");
  const signature = req.headers.get("svix-signature") ?? req.headers.get("webhook-signature");
  if (!id || !timestamp || !signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = verifyResendWebhook(payload, { id, timestamp, signature }, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const kind = outreachEventKind(event.type);
  const resendId = event.data?.email_id;
  if (kind && resendId) {
    await recordOutreachEvent(id, resendId, kind);
    revalidatePath("/admin/mailing");
  }
  return NextResponse.json({ ok: true });
}
