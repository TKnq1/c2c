import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Who did what from /admin. Never lets a logging failure undo or block the action itself.
export async function audit(adminId: string, action: string, targetId?: string, details?: Prisma.InputJsonValue) {
  try {
    await prisma.adminAuditLog.create({ data: { adminId, action, targetId, details } });
  } catch (err) {
    console.error("Writing the admin audit log failed:", err);
  }
}
