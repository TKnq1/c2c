"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundHeldPayment, releaseHeldPayment, type MoneyMoveResult } from "@/lib/payment-release";

// Settling a payment a brand reported a problem on — from /admin only. The
// decision itself happens outside the app (look at the post, talk to both
// sides); these just carry it out.
async function loadDisputedPayment(interestId: string): Promise<MoneyMoveResult | null> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { error: "Not authorized." };

  const interest = await prisma.interest.findUnique({ where: { id: interestId } });
  if (!interest || interest.paymentStatus !== "HELD" || !interest.disputedAt) {
    return { error: "This payment isn't under review anymore." };
  }
  return null;
}

export async function releaseDisputedPaymentAction(interestId: string): Promise<MoneyMoveResult> {
  const blocked = await loadDisputedPayment(interestId);
  if (blocked) return blocked;
  return releaseHeldPayment(interestId, "admin");
}

export async function refundDisputedPaymentAction(interestId: string): Promise<MoneyMoveResult> {
  const blocked = await loadDisputedPayment(interestId);
  if (blocked) return blocked;
  return refundHeldPayment(interestId, "admin");
}
