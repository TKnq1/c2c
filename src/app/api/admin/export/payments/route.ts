import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { berlinMonthRange, buildPaymentsCsv, type PaymentRow } from "@/lib/export-payments";
import { prisma } from "@/lib/prisma";

// The month's payments as a CSV for the tax advisor. Payments of the platform's own customers (brand and creator names)
// leave the app here, so it is admin-only, the password-protected admin session is re-checked, and every download is logged.
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return new NextResponse("Not authorized", { status: 403 });

  const month = new URL(req.url).searchParams.get("month") ?? "";
  const range = berlinMonthRange(month);
  if (!range) return new NextResponse("Use ?month=YYYY-MM", { status: 400 });

  const within = { gte: range.start, lt: range.end };
  const interests = await prisma.interest.findMany({
    where: { OR: [{ paidAt: within }, { releasedAt: within }, { refundedAt: within }] },
    select: {
      amountCents: true,
      platformFeeCents: true,
      payoutCents: true,
      paymentStatus: true,
      paidAt: true,
      releasedAt: true,
      refundedAt: true,
      stripeChargeId: true,
      stripeTransferId: true,
      stripeRefundId: true,
      creator: { select: { displayName: true } },
      request: { select: { title: true, startup: { select: { companyName: true } } } },
    },
    orderBy: [{ paidAt: "asc" }, { releasedAt: "asc" }],
  });
  const rows: PaymentRow[] = interests.map((i) => ({
    request: i.request.title,
    brand: i.request.startup.companyName,
    creator: i.creator.displayName,
    status: i.paymentStatus ?? "",
    amountCents: i.amountCents,
    // Fee and payout are earned when the payment is released; for one still held or refunded they would only be plans.
    feeCents: i.paymentStatus === "RELEASED" ? i.platformFeeCents : null,
    payoutCents: i.paymentStatus === "RELEASED" ? i.payoutCents : null,
    paidAt: i.paidAt,
    releasedAt: i.releasedAt,
    refundedAt: i.refundedAt,
    chargeId: i.stripeChargeId,
    transferId: i.stripeTransferId,
    refundId: i.stripeRefundId,
  }));

  await audit(session.user.id, "export.payments", month, { rows: rows.length });
  return new NextResponse(buildPaymentsCsv(rows, month, range, new Date()), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="comtor-zahlungen-${month}.csv"`,
      "cache-control": "no-store",
    },
  });
}
