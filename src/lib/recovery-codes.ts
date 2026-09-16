import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Recovery codes are high-entropy random strings, not user-chosen secrets,
// so a fast hash is appropriate here — unlike passwords, there's no need
// for bcrypt's deliberate slowness.
function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
  });
}

export async function saveRecoveryCodes(userId: string, codes: string[]) {
  await prisma.recoveryCode.deleteMany({ where: { userId } });
  await prisma.recoveryCode.createMany({
    data: codes.map((code) => ({ userId, codeHash: hashCode(code) })),
  });
}

export async function verifyAndConsumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!/^[0-9A-F]{5}-[0-9A-F]{5}$/.test(normalized)) return false;

  const match = await prisma.recoveryCode.findFirst({
    where: { userId, codeHash: hashCode(normalized), usedAt: null },
  });
  if (!match) return false;

  await prisma.recoveryCode.update({ where: { id: match.id }, data: { usedAt: new Date() } });
  return true;
}
