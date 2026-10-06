import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Encrypts small secrets (the two-factor secret) at rest with AES-256-GCM. The key is
// TOTP_ENCRYPTION_KEY: 32 random bytes, base64 (openssl rand -base64 32). Without it
// secrets are stored as before and read back unchanged, so the feature can be switched
// on later; a sealed value starts with "enc:v1:" and is recognised by that.
const PREFIX = "enc:v1:";

function key(): Buffer | null {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("TOTP_ENCRYPTION_KEY must be 32 bytes, base64 encoded.");
  return buf;
}

export function isSealed(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function seal(plain: string): string {
  const k = key();
  if (!k) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function open(stored: string): string {
  if (!isSealed(stored)) return stored;
  const k = key();
  if (!k) throw new Error("A sealed secret was found but TOTP_ENCRYPTION_KEY is not set.");
  const [iv, tag, data] = stored.slice(PREFIX.length).split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", k, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
