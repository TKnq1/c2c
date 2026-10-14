import type { VatIdStatus } from "@prisma/client";
import { parseVatId } from "@/lib/tax/vat-id";

// VIES, the EU Commission's VAT number check. Its answer is the proof that a business abroad really is a taxable
// person, which is what lets us invoice it without VAT (reverse charge). A "qualified" request (with our own VAT ID as
// the requester) also returns a consultation number that documents the check for the tax authorities.

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";
const TIMEOUT_MS = 10_000;

// Answers that mean "ask again later", not "the number is wrong".
const RETRY_LATER = new Set([
  "MS_UNAVAILABLE",
  "MS_MAX_CONCURRENT_REQ",
  "GLOBAL_MAX_CONCURRENT_REQ",
  "SERVICE_UNAVAILABLE",
  "TIMEOUT",
  "SERVER_BUSY",
  "VAT_BLOCKED",
  "IP_BLOCKED",
]);

export type ViesResult = {
  status: VatIdStatus;
  consultationNumber: string | null;
  name: string | null;
  address: string | null;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() && value.trim() !== "---" ? value.trim() : null;
}

// The REST API answers with { valid, requestIdentifier, name, address, ... } and, when a member state is down, with
// an error list or a userError code. Anything that is not a clear yes or no is UNAVAILABLE.
export function mapViesResponse(httpStatus: number, body: unknown): ViesResult {
  const unavailable: ViesResult = { status: "UNAVAILABLE", consultationNumber: null, name: null, address: null };
  if (httpStatus >= 500 || httpStatus === 429) return unavailable;
  if (!body || typeof body !== "object") return unavailable;
  const data = body as Record<string, unknown>;

  const errors = Array.isArray(data.errorWrappers) ? (data.errorWrappers as { error?: unknown }[]) : [];
  const errorCodes = [...errors.map((e) => String(e.error ?? "")), typeof data.userError === "string" ? data.userError : ""].filter(Boolean);
  if (errorCodes.some((code) => RETRY_LATER.has(code))) return unavailable;
  if (errorCodes.some((code) => code === "INVALID_INPUT" || code === "INVALID")) {
    return { status: "INVALID", consultationNumber: null, name: null, address: null };
  }

  if (data.valid === true) {
    return {
      status: "VALID",
      consultationNumber: text(data.requestIdentifier),
      name: text(data.name),
      address: text(data.address),
    };
  }
  if (data.valid === false) return { status: "INVALID", consultationNumber: null, name: null, address: null };
  return unavailable;
}

export type ViesRequester = { prefix: string; number: string };

// The platform's own VAT ID (IMPRINT_VAT_ID) as the requester of a qualified check, when it is a well-formed one.
export function platformRequester(env: Record<string, string | undefined> = process.env): ViesRequester | null {
  const raw = env.IMPRINT_VAT_ID;
  if (!raw) return null;
  const parsed = parseVatId(raw);
  return parsed.ok ? { prefix: parsed.vatId.prefix, number: parsed.vatId.number } : null;
}

export async function checkVatId(
  vatId: { prefix: string; number: string },
  requester: ViesRequester | null = platformRequester(),
  fetchImpl: typeof fetch = fetch,
): Promise<ViesResult> {
  try {
    const response = await fetchImpl(VIES_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        countryCode: vatId.prefix,
        vatNumber: vatId.number,
        ...(requester ? { requesterMemberStateCode: requester.prefix, requesterNumber: requester.number } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    return mapViesResponse(response.status, body);
  } catch {
    return { status: "UNAVAILABLE", consultationNumber: null, name: null, address: null };
  }
}
