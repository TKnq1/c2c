import { NextResponse } from "next/server";

// TEMPORARY — diagnosing a persistent "Invalid character in header
// content" error from the Stripe SDK that survived three re-entries of
// STRIPE_SECRET_KEY and a defensive .trim(). Reveals only whether the
// value is entirely printable ASCII and its length — never the value, a
// hash, or a prefix. Delete once resolved.
export async function GET() {
  const raw = process.env.STRIPE_SECRET_KEY;
  const trimmed = raw?.trim();
  return NextResponse.json({
    isSet: !!raw,
    rawLength: raw?.length ?? null,
    trimmedLength: trimmed?.length ?? null,
    isAllPrintableAscii: trimmed ? /^[\x20-\x7E]+$/.test(trimmed) : null,
    startsWithSkTest: trimmed?.startsWith("sk_test_") ?? null,
  });
}
