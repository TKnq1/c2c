import { NextResponse } from "next/server";

// TEMPORARY — diagnosing a persistent "Invalid character in header
// content" error from the Stripe SDK that survived three re-entries of
// STRIPE_SECRET_KEY and a defensive .trim(). Reveals only whether the
// value is entirely printable ASCII and its length — never the value, a
// hash, or a prefix. Delete once resolved.
export async function GET() {
  const raw = process.env.STRIPE_SECRET_KEY;
  const trimmed = raw?.trim();
  // Index only — never the character itself, its code point, or
  // surrounding context, so this can't be used to reconstruct the key.
  const badChars = trimmed ? [...trimmed].filter((ch) => ch.codePointAt(0)! < 0x20 || ch.codePointAt(0)! > 0x7e) : [];
  const distinctBadCodePoints = [...new Set(badChars.map((ch) => ch.codePointAt(0)))];
  return NextResponse.json({
    isSet: !!raw,
    rawLength: raw?.length ?? null,
    trimmedLength: trimmed?.length ?? null,
    isAllPrintableAscii: badChars.length === 0,
    badCharCount: badChars.length,
    // How many DISTINCT bad values there are, and what they are only when
    // there's a single repeated one (e.g. U+FFFD, the standard
    // decode-error placeholder) — that's an encoding-bug signature, not
    // secret content. Suppressed if there's more than one distinct value.
    distinctBadCodePointCount: distinctBadCodePoints.length,
    theSharedBadCodePoint: distinctBadCodePoints.length === 1 ? distinctBadCodePoints[0] : null,
    startsWithSkTest: trimmed?.startsWith("sk_test_") ?? null,
  });
}
