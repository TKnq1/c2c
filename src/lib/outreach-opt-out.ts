import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/site";

type Side = "CREATOR" | "STARTUP";

function secret() {
  return process.env.AUTH_SECRET?.trim() ?? "";
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
