import { NextResponse } from "next/server";
import { createHash } from "crypto";

// TEMPORARY — diagnosing a production-only webhook signature mismatch.
// Returns only a boolean match against a hardcoded expected hash — never
// the stored value, a hash of it, or any prefix/length, so nothing about
// the actual secret is recoverable from the response either way. Delete
// this file once the mismatch is found.
const EXPECTED_WEBHOOK_SECRET_HASH = "8115c238affce16d2f1b25c354406cf7c371035a0e58d0bb62baffe412e0ef21";

export async function GET() {
  const stored = process.env.STRIPE_WEBHOOK_SECRET;
  const actualHash = stored ? createHash("sha256").update(stored).digest("hex") : null;
  return NextResponse.json({
    webhookSecretIsSet: !!stored,
    webhookSecretMatchesExpected: actualHash === EXPECTED_WEBHOOK_SECRET_HASH,
  });
}
