import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { berlinQuarterRange, buildInvoicesCsv, buildZmCsv, type InvoiceRow } from "@/lib/export-invoices";
import { berlinMonthRange } from "@/lib/export-payments";
import type { InvoiceParty } from "@/lib/billing/issuer";
import { prisma } from "@/lib/prisma";

// The month's invoices, credit notes and cancellations as a CSV for the tax advisor, or with ?report=zm the summary of the services
// sold to businesses in other EU countries for a quarter. The documents carry the names and tax IDs of the platform's customers,
// so this is admin-only, the admin session is re-checked, and every download is logged.
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return new NextResponse("Not authorized", { status: 403 });

  const params = new URL(req.url).searchParams;
  const zm = params.get("report") === "zm";
  const period = (zm ? params.get("quarter") : params.get("month")) ?? "";
  const range = zm ? berlinQuarterRange(period) : berlinMonthRange(period);
  if (!range) return new NextResponse(zm ? "Use ?report=zm&quarter=YYYY-Q1" : "Use ?month=YYYY-MM", { status: 400 });

  const invoices = await prisma.invoice.findMany({
    where: { issuedAt: { gte: range.start, lt: range.end } },
    orderBy: [{ issuedAt: "asc" }, { number: "asc" }],
    include: { cancels: { select: { number: true } } },
  });
  const rows: InvoiceRow[] = invoices.map((invoice) => {
    const issuer = invoice.issuer as unknown as InvoiceParty;
    const recipient = invoice.recipient as unknown as InvoiceParty;
    return {
      number: invoice.number,
      kind: invoice.kind,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      servicePeriodStart: invoice.servicePeriodStart,
      servicePeriodEnd: invoice.servicePeriodEnd,
      issuerName: issuer.name,
      issuerVatId: issuer.vatId,
      recipientName: recipient.name,
      recipientCountry: recipient.country,
      recipientVatId: recipient.vatId,
      taxTreatment: invoice.taxTreatment,
      netCents: invoice.netCents,
      vatRateBp: invoice.vatRateBp,
      vatCents: invoice.vatCents,
      grossCents: invoice.grossCents,
      cancelsNumber: invoice.cancels?.number ?? null,
      dealId: invoice.dealId,
    };
  });

  await audit(session.user.id, zm ? "export.zm" : "export.invoices", period, { rows: rows.length });
  const body = zm ? buildZmCsv(rows, period, new Date()) : buildInvoicesCsv(rows, period, new Date());
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="comtor-${zm ? "zm" : "belege"}-${period}.csv"`,
      "cache-control": "no-store",
    },
  });
}
