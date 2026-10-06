import { NextResponse } from "next/server";
import { isOutreachSide, outreachOptOutMatches } from "@/lib/outreach-opt-out";
import { completeOutreachOptOut } from "@/lib/outreach-suppression";

// One-click unsubscribe (RFC 8058): the mail header points here and the mail program POSTs without showing
// a page. The signed link is the whole check. A GET (a link scanner, a prefetch) does nothing.
export async function POST(req: Request) {
  const params = new URL(req.url).searchParams;
  const email = params.get("email") ?? "";
  const side = params.get("side") ?? "";
  const token = params.get("token") ?? "";
  if (!isOutreachSide(side) || !outreachOptOutMatches(email, side, token)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  await completeOutreachOptOut(email);
  return NextResponse.json({ ok: true });
}
