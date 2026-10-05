// One-off: encrypts the two-factor secrets that were stored as plain text before TOTP_ENCRYPTION_KEY was set.
// Safe to run again (already sealed values are skipped).
//
//   TOTP_ENCRYPTION_KEY=$(openssl rand -base64 32) DATABASE_URL=... node scripts/seal-totp-secrets.mjs
//
// Keep that key: without it the sealed secrets can't be read, and nobody with two-factor can sign in.
import "dotenv/config";
import { createCipheriv, randomBytes } from "node:crypto";
import pg from "pg";

const PREFIX = "enc:v1:";
const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
if (!raw) throw new Error("Set TOTP_ENCRYPTION_KEY first.");
const key = Buffer.from(raw, "base64");
if (key.length !== 32) throw new Error("TOTP_ENCRYPTION_KEY must be 32 bytes, base64 encoded.");

function seal(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query(`SELECT id, "totpSecret" FROM "User" WHERE "totpSecret" IS NOT NULL AND "totpSecret" NOT LIKE $1`, [`${PREFIX}%`]);
  for (const row of rows) {
    await client.query(`UPDATE "User" SET "totpSecret" = $1 WHERE id = $2`, [seal(row.totpSecret), row.id]);
  }
  console.log(`Sealed ${rows.length} secret(s).`);
} finally {
  await client.end();
}
