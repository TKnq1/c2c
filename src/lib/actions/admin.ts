"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Same shape ConfirmActionButton expects: an error message, or nothing.
export type AdminActionResult = { error?: string };

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

const suspendSchema = z.object({
  reason: z.string().trim().min(3, "Give a short reason (at least 3 characters).").max(500),
});

// Suspending also closes the account's open requests, so brands that are
// locked out don't keep collecting interest from creators in the Feed.
export async function suspendUserAction(userId: string, reason: string): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };
  if (userId === session.user.id) return { error: "You can't suspend your own account." };

  const parsed = suspendSchema.safeParse({ reason });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { startupProfile: true } });
  if (!user) return { error: "This account no longer exists." };
  if (user.role === "ADMIN") return { error: "Admin accounts can't be suspended here." };
  if (user.suspendedAt) return { error: "This account is already suspended." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: new Date(), suspendedReason: parsed.data.reason },
    }),
    ...(user.startupProfile
      ? [
          prisma.request.updateMany({
            where: { startupId: user.startupProfile.id, status: "OPEN" },
            data: { status: "CLOSED" },
          }),
        ]
      : []),
  ]);

  revalidateAdmin();
  return {};
}

export async function unsuspendUserAction(userId: string): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { suspendedAt: true } });
  if (!user) return { error: "This account no longer exists." };
  if (!user.suspendedAt) return { error: "This account isn't suspended." };

  await prisma.user.update({ where: { id: userId }, data: { suspendedAt: null, suspendedReason: null } });

  revalidateAdmin();
  return {};
}

export async function setRequestStatusAction(requestId: string, status: "OPEN" | "CLOSED"): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized." };

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { status: true, startup: { select: { user: { select: { suspendedAt: true } } } } },
  });
  if (!request) return { error: "This request no longer exists." };
  if (request.status === status) return { error: `This request is already ${status === "OPEN" ? "open" : "closed"}.` };
  if (status === "OPEN" && request.startup.user.suspendedAt) {
    return { error: "The brand behind this request is suspended. Unsuspend the account first." };
  }

  await prisma.request.update({ where: { id: requestId }, data: { status } });

  revalidateAdmin();
  revalidatePath("/dashboard/creator");
  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  return {};
}
