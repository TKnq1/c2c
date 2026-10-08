import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { PrintButton } from "@/components/print-button";
import { dealLocale } from "@/lib/deals/copy";
import { parseBody } from "@/lib/billing/invoice";
import type { InvoiceParty } from "@/lib/billing/issuer";
import { uiText } from "@/lib/deals/ui-copy";
import { formatCents } from "@/lib/format";

function PartyBlock({ title, party, u }: { title: string; party: InvoiceParty; u: ReturnType<typeof uiText> }) {
  return (
    <div className="text-sm">
      <p className="mb-1 text-footnote text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="font-medium">{party.name}</p>
      {party.addressLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <p>{party.country}</p>
      {party.vatId && <p className="mt-1">{u("invoices.vatId", { id: party.vatId })}</p>}
      {party.taxNumber && <p className={party.vatId ? "" : "mt-1"}>{u("invoices.taxNumber", { id: party.taxNumber })}</p>}
    </div>
  );
}

const day = (date: Date) => date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });

// An issued invoice or credit note as the document it is. Reads what was stored when it was issued, never the current
// profiles. "PDF" is the browser's print dialog, with the app chrome hidden.
export default async function InvoicePage(props: PageProps<"/dashboard/invoices/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) redirect("/login");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) notFound();
  if (invoice.recipientUserId !== session.user.id && !hasAdminAccess(session.user)) notFound();

  const u = uiText(dealLocale(await getLocale()));
  const issuer = invoice.issuer as unknown as InvoiceParty;
  const recipient = invoice.recipient as unknown as InvoiceParty;
  const body = parseBody(invoice.lines);
  const credit = invoice.kind === "CREATOR_CREDIT_NOTE";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8">
      <div className="flex items-center justify-between gap-3 no-print">
        <Link href={`/dashboard/deals/${invoice.dealId}`} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-ink dark:text-neutral-400">
          <IoChevronBack className="h-4 w-4" aria-hidden />
          {u("invoices.deal")}
        </Link>
        <PrintButton />
      </div>

      <article className="flex flex-col gap-6 rounded bg-fog p-5 print:bg-transparent print:p-0 sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-title-1 font-bold">{u(invoice.cancelsInvoiceId ? `invoices.storno.${invoice.kind}` : `invoices.kind.${invoice.kind}`)}</h1>
            <p className="text-sm tabular-nums">
              {u("invoices.number")} {invoice.number}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              {u("invoices.date")}: {day(invoice.issuedAt)}
            </p>
            {invoice.servicePeriodStart && invoice.servicePeriodEnd && (
              <p>
                {u("invoices.servicePeriod")}: {day(invoice.servicePeriodStart)} – {day(invoice.servicePeriodEnd)}
              </p>
            )}
            {invoice.status === "CANCELLED" && <p className="font-bold">{u("invoices.cancelled")}</p>}
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <PartyBlock title={u("invoices.from")} party={issuer} u={u} />
          <PartyBlock title={u("invoices.to")} party={recipient} u={u} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-footnote text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                <th className="py-2 pr-3 font-normal">{u("invoices.description")}</th>
                <th className="px-3 py-2 text-right font-normal">{u("invoices.qty")}</th>
                <th className="py-2 pl-3 text-right font-normal">{u("invoices.net")}</th>
              </tr>
            </thead>
            <tbody>
              {body.items.map((item) => (
                <tr key={item.description} className="border-b border-neutral-200 align-top dark:border-neutral-800">
                  <td className="py-2 pr-3">{item.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2 pl-3 text-right tabular-nums">{formatCents(item.netCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt>{u("invoices.net")}</dt>
            <dd className="tabular-nums">{formatCents(invoice.netCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{invoice.vatRateBp > 0 ? u("invoices.vat", { rate: invoice.vatRateBp / 100 }) : u("invoices.vatNone")}</dt>
            <dd className="tabular-nums">{formatCents(invoice.vatCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-300 pt-1 text-base font-bold dark:border-neutral-700">
            <dt>{credit ? u("invoices.grossCredit") : u("invoices.gross")}</dt>
            <dd className="tabular-nums">{formatCents(invoice.grossCents)}</dd>
          </div>
        </dl>

        {(invoice.legalNote || body.notes.length > 0) && (
          <div className="flex flex-col gap-1 border-t border-neutral-300 pt-4 text-xs dark:border-neutral-700">
            {invoice.legalNote && <p className="font-medium">{invoice.legalNote}</p>}
            {body.notes.map((note) => (
              <p key={note} className="text-neutral-600 dark:text-neutral-400">
                {note}
              </p>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
