import { prisma } from "@/lib/prisma";

// A verified email is needed for what reaches other people or moves money: posting
// a request, starting a chat, offers, payments, payout setup. Without it anyone could
// open throwaway accounts on someone else's address. Set REQUIRE_VERIFIED_EMAIL=0 only
// if verification emails can't be delivered.
export const VERIFY_EMAIL_MESSAGE =
  "Please confirm your email address first: open the link we sent you and tap \"Confirm verification\", or request a new link at /dashboard/verify-email.";

export async function emailIsVerified(userId: string): Promise<boolean> {
  if (process.env.REQUIRE_VERIFIED_EMAIL === "0") return true;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
  return user?.emailVerified === true;
}
