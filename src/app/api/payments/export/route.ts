import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",");
}

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });

  const lines = [csvRow(["Date", "Counterparty", "Request", "Amount", "Platform fee", "Payout", "Status"])];

  if (session.user.role === "STARTUP") {
    const rows = await prisma.interest.findMany({
      where: {
        request: { startup: { userId: session.user.id } },
        paymentStatus: { in: ["HELD", "RELEASED", "REFUNDED"] },
      },
      include: { creator: true, request: true },
      orderBy: { paidAt: "desc" },
    });
    for (const r of rows) {
      lines.push(
        csvRow([
          r.paidAt ? r.paidAt.toISOString().slice(0, 10) : "",
          r.creator.displayName,
          r.request.title,
          formatCents(r.amountCents ?? 0),
          formatCents(r.platformFeeCents ?? 0),
          formatCents(r.payoutCents ?? 0),
          r.paymentStatus ?? "",
        ]),
      );
    }
  } else {
    const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
    const rows = await prisma.interest.findMany({
      where: { creatorId: creator.id, paymentStatus: { in: ["HELD", "RELEASED", "REFUNDED"] } },
      include: { request: { include: { startup: true } } },
      orderBy: { paidAt: "desc" },
    });
    for (const r of rows) {
      lines.push(
        csvRow([
          r.paidAt ? r.paidAt.toISOString().slice(0, 10) : "",
          r.request.startup.companyName,
          r.request.title,
          formatCents(r.amountCents ?? 0),
          formatCents(r.platformFeeCents ?? 0),
          formatCents(r.payoutCents ?? 0),
          r.paymentStatus ?? "",
        ]),
      );
    }
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments.csv"',
    },
  });
}
