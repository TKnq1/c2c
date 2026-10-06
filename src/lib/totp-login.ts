import { prisma } from "@/lib/prisma";
import { matchTotpStep } from "@/lib/totp";
import { open } from "@/lib/secret-box";

// Accepts an authenticator code once: the step it belongs to is recorded, and a step that was already
// used (or an older one) is refused, so a code can't be replayed for the rest of its window.
// One conditional update, so two parallel sign-ins with the same code can't both get through.
export async function consumeTotpCode(user: { id: string; totpSecret: string | null }, code: string): Promise<boolean> {
  if (!user.totpSecret) return false;
  const step = matchTotpStep(open(user.totpSecret), code);
  if (step === null) return false;
  const claimed = await prisma.user.updateMany({
    where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpLastStep: step },
  });
  return claimed.count === 1;
}
