import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { generateTotpSecret, matchTotpStep, verifyTotpCode } from "@/lib/totp";

// What an authenticator app computes, written independently of totp.ts.
function codeAt(secret: string, at: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of secret) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const counter = Math.floor(at / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", Buffer.from(bytes)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const num = ((hmac[offset] & 127) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(num % 1e6).padStart(6, "0");
}

describe("matchTotpStep", () => {
  const secret = generateTotpSecret();
  const now = 1_800_000_000_000;
  const step = Math.floor(now / 1000 / 30);

  it("returns the step the code belongs to, so a used step can be refused", () => {
    expect(matchTotpStep(secret, codeAt(secret, now), now)).toBe(step);
    expect(matchTotpStep(secret, codeAt(secret, now - 30_000), now)).toBe(step - 1);
    expect(matchTotpStep(secret, codeAt(secret, now + 30_000), now)).toBe(step + 1);
  });

  it("rejects codes outside the window and malformed input", () => {
    expect(matchTotpStep(secret, codeAt(secret, now - 120_000), now)).toBeNull();
    expect(matchTotpStep(secret, "12345", now)).toBeNull();
    expect(matchTotpStep(secret, "abcdef", now)).toBeNull();
  });

  it("keeps verifyTotpCode working", () => {
    expect(verifyTotpCode(secret, codeAt(secret, now), now)).toBe(true);
    expect(verifyTotpCode(secret, "000000", now)).toBe(codeAt(secret, now) === "000000");
  });
});
