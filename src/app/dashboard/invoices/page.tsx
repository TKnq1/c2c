import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IoDocumentTextOutline } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { cardClass } from "@/components/deals/ui";
import { DealsTabs } from "@/components/deals/deals-tabs";
import { dealLocale } from "@/lib/deals/copy";
import { formatDealDate } from "@/lib/deals/notices";
import { uiText } from "@/lib/deals/ui-copy";
import { canUseDeals } from "@/lib/deals/queries";
import { formatCents } from "@/lib/format";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) redirect("/login");
  if (!(await canUseDeals(session.user.id, session.user.role))) notFound();
  const locale = dealLocale(await getLocale());
  const u = uiText(locale);

  const invoices = await prisma.invoice.findMany({
    where: { recipientUserId: session.user.id },
    orderBy: { issuedAt: "desc" },
    select: { id: true, number: true, kind: true, status: true, grossCents: true, issuedAt: true, dealId: true, cancelsInvoiceId: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
      <PageTitle description={u("invoices.listDescription")}>{u("invoices.listTitle")}</PageTitle>
      <DealsTabs current="invoices" userId={session.user.id} role={session.user.role} locale={locale} />
      {invoices.length === 0 ? (
        <EmptyState icon={IoDocumentTextOutline} title={u("invoices.empty")} description={u("invoices.none")} />
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((invoice) => (
            <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className={`${cardClass} flex items-center gap-3 transition hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60`}>
              <IoDocumentTextOutline className="h-6 w-6 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u(invoice.cancelsInvoiceId ? `invoices.storno.${invoice.kind}` : `invoices.kind.${invoice.kind}`)} {invoice.number}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDealDate(invoice.issuedAt, locale).split(",")[0]}
                  {invoice.status === "CANCELLED" ? ` · ${u("invoices.cancelled")}` : ""}
                </p>
              </div>
              <p className="font-bold tabular-nums">{formatCents(invoice.grossCents)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
