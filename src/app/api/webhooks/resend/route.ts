import { NextResponse } from "next/server";

// Open and click tracking of marketing mail is gone (it would need the recipient's consent), so nothing is
// recorded from here any more. The route stays only so that a webhook still configured in Resend gets an
// answer instead of an error; delete the webhook there.
export async function POST() {
  return NextResponse.json({ ok: true });
}
