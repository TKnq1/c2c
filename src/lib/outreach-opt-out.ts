import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/site";

type Side = "CREATOR" | "STARTUP";

// Its own key (OPT_OUT_SECRET), the session secret only as a fallback until one is set. Never an empty
// key: with nothing configured every link would be forgeable.
function secret() {
  const key = process.env.OPT_OUT_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (!key) throw new Error("OPT_OUT_SECRET (or AUTH_SECRET) must be set to sign opt-out links.");
  return key;
}

export function isOutreachSide(value: string): value is Side {
  return value === "CREATOR" || value === "STARTUP";
}

export function outreachOptOutToken(email: string, side: Side) {
  return createHmac("sha256", secret()).update(`outreach-opt-out:${side}:${email.trim().toLowerCase()}`).digest("base64url");
}

export function outreachOptOutMatches(email: string, side: Side, token: string) {
  const expected = outreachOptOutToken(email, side);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function outreachOptOutUrl(email: string, side: Side) {
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
    side,
    token: outreachOptOutToken(email, side),
  });
  return `${SITE_URL}/outreach/opt-out?${params.toString()}`;
}

// The same signed link for the one-click unsubscribe of the mail header (RFC 8058): a mail program POSTs to it
// without anyone opening a page.
export function outreachUnsubscribeUrl(email: string, side: Side) {
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
    side,
    token: outreachOptOutToken(email, side),
  });
  return `${SITE_URL}/api/outreach/unsubscribe?${params.toString()}`;
}

export function outreachListUnsubscribeHeaders(email: string, side: Side): Record<string, string> {
  return {
    "List-Unsubscribe": `<${outreachUnsubscribeUrl(email, side)}>, <mailto:info@comtor.app?subject=Unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
