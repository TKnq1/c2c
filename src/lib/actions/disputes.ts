"use server";

import { confirmAdminPassword, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { refundHeldPayment, releaseHeldPayment, type MoneyMoveResult } from "@/lib/payment-release";

// Settling a payment a brand reported a problem on — from /admin only. The
// decision itself happens outside the app (look at the post, talk to both
// sides); these just carry it out.
//
// Both ask for the admin's password again, and are recorded in the audit log.
async function loadDisputedPayment(
  interestId: string,
  password: string,
): Promise<{ error: MoneyMoveResult } | { adminId: string }> {
  const session = await requireAdmin();
  if (!session) return { error: { error: "Not authorized." } };
  const passwordError = await confirmAdminPassword(session.user.id, password);
  if (passwordError) return { error: { error: passwordError } };

  const interest = await prisma.interest.findUnique({ where: { id: interestId }, include: { deal: { select: { id: true } } } });
  if (!interest || interest.paymentStatus !== "HELD" || !interest.disputedAt) {
    return { error: { error: "This payment isn't under review anymore." } };
  }
  // A brand deal is settled together with its money, from /admin/deals: paying out around it would leave the deal frozen.
  if (interest.deal) return { error: { error: "This payment belongs to a brand deal. Settle it under Brand Deals." } };
  return { adminId: session.user.id };
}

export async function releaseDisputedPaymentAction(interestId: string, password: string): Promise<MoneyMoveResult> {
  const checked = await loadDisputedPayment(interestId, password);
  if ("error" in checked) return checked.error;
  await audit(checked.adminId, "payment.release", interestId);
  return releaseHeldPayment(interestId, "admin");
}

export async function refundDisputedPaymentAction(interestId: string, password: string): Promise<MoneyMoveResult> {
  const checked = await loadDisputedPayment(interestId, password);
  if ("error" in checked) return checked.error;
  await audit(checked.adminId, "payment.refund", interestId);
  return refundHeldPayment(interestId, "admin");
}
