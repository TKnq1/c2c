import { createHash, createHmac, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Recovery codes get you past two-factor authentication, so they are as strong as
// the password: 80 random bits, stored as an HMAC keyed with RECOVERY_CODE_PEPPER
// (a copy of the database alone can't be used to test guesses).
// Codes from before this change (40 bits, "XXXXX-XXXXX", plain SHA-256) still work
// until they're used or the person generates a new set.
const NEW_FORMAT = /^[0-9A-F]{5}(-[0-9A-F]{5}){3}$/;
const OLD_FORMAT = /^[0-9A-F]{5}-[0-9A-F]{5}$/;

function hashCode(code: string): string {
  return createHmac("sha256", process.env.RECOVERY_CODE_PEPPER ?? "").update(code).digest("hex");
}

function legacyHashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(10).toString("hex").toUpperCase(); // 20 hex chars = 80 bits
    return [0, 5, 10, 15].map((i) => raw.slice(i, i + 5)).join("-");
  });
}

export async function saveRecoveryCodes(userId: string, codes: string[]) {
  await prisma.recoveryCode.deleteMany({ where: { userId } });
  await prisma.recoveryCode.createMany({
    data: codes.map((code) => ({ userId, codeHash: hashCode(code) })),
  });
}

// One atomic update: two parallel sign-ins can't both consume the same code.
export async function verifyAndConsumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  const codeHash = NEW_FORMAT.test(normalized) ? hashCode(normalized) : OLD_FORMAT.test(normalized) ? legacyHashCode(normalized) : null;
  if (!codeHash) return false;

  const consumed = await prisma.recoveryCode.updateMany({
    where: { userId, codeHash, usedAt: null },
    data: { usedAt: new Date() },
  });
  return consumed.count === 1;
}
