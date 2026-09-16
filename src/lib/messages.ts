import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Mirrors the per-conversation unread check already used on the Messages
// inbox page (m.senderRole !== role && !m.read), just scoped to a count
// across every conversation this user is part of.
export async function getUnreadMessageCount(userId: string, role: Role) {
  const interestFilter =
    role === "STARTUP" ? { request: { startup: { userId } } } : { creator: { userId } };

  return prisma.message.count({
    where: { interest: interestFilter, senderRole: { not: role }, read: false },
  });
}
