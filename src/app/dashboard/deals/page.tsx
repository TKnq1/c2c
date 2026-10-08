import Link from "next/link";
import { redirect } from "next/navigation";
import { IoBriefcaseOutline, IoDocumentTextOutline } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { Badge, Section, cardClass } from "@/components/deals/ui";
import { dealLocale } from "@/lib/deals/copy";
import { getLocale } from "@/lib/i18n/server";
import { nextStep } from "@/lib/deals/next-step";
import { formatDealDate } from "@/lib/deals/notices";
import { isMyTurn, listDealsForUser, type DealListItem } from "@/lib/deals/queries";
import { isTerminal } from "@/lib/deals/status";
import { parseTerms } from "@/lib/deals/terms";
import { uiText } from "@/lib/deals/ui-copy";
import { businessReadiness } from "@/lib/tax/business";
import { hasErrors } from "@/lib/deals/issues";
import { formatCents } from "@/lib/format";

export default async function DealsPage() {
  const session = await auth();
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) redirect("/login");
  const role = session.user.role;
  const locale = dealLocale(await getLocale());
  const u = uiText(locale);

  const [deals, profile] = await Promise.all([
    listDealsForUser(session.user.id, role),
    prisma.businessProfile.findUnique({ where: { userId: session.user.id } }),
  ]);
  const needsBusiness = hasErrors(businessReadiness(profile, role));

  const mine = deals.filter((d) => !isTerminal(d.status) && isMyTurn(d, role));
  const running = deals.filter((d) => !isTerminal(d.status) && !isMyTurn(d, role));
  const finished = deals.filter((d) => isTerminal(d.status));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-8">
      <PageTitle description={u("deals.description")}>{u("deals.title")}</PageTitle>

      {needsBusiness && (
        <div className={`${cardClass} flex flex-col gap-2 text-sm`}>
          <p>{u("deals.businessBanner")}</p>
          <Link href="/dashboard/business" className="w-fit rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite">
            {u("deals.businessAction")}
          </Link>
        </div>
      )}

      {deals.length === 0 ? (
        <EmptyState icon={IoBriefcaseOutline} title={u("deals.empty")} description={role === "STARTUP" ? u("deals.emptyBrand") : u("deals.emptyCreator")} />
      ) : (
        <>
          {mine.length > 0 && <DealGroup title={u("deals.yourTurn")} deals={mine} role={role} locale={locale} highlight />}
          {running.length > 0 && <DealGroup title={u("deals.running")} deals={running} role={role} locale={locale} />}
          {finished.length > 0 && <DealGroup title={u("deals.finished")} deals={finished} role={role} locale={locale} />}
        </>
      )}

      <div className="flex flex-wrap gap-4 px-1 text-sm">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 underline">
          <IoDocumentTextOutline className="h-4 w-4" aria-hidden />
          {u("deals.invoices")}
        </Link>
        <Link href="/dashboard/business" className="underline">
          {u("deals.businessLink")}
        </Link>
      </div>
    </div>
  );
}

function DealGroup({ title, deals, role, locale, highlight = false }: { title: string; deals: DealListItem[]; role: "STARTUP" | "CREATOR"; locale: "de" | "en"; highlight?: boolean }) {
  const u = uiText(locale);
  return (
    <Section title={title}>
      <div className="flex flex-col gap-2">
        {deals.map((deal) => {
          const { interest } = deal;
          const other = role === "STARTUP" ? interest.creator : interest.request.startup;
          const name = "displayName" in other ? other.displayName : other.companyName;
          const step = nextStep(
            {
              status: deal.status,
              role,
              brandSigned: deal.brandSignedAt !== null,
              creatorSigned: deal.creatorSignedAt !== null,
              draftRequired: parseTerms(deal.terms).workflow.draftRequired,
              brandName: interest.request.startup.companyName,
              creatorName: interest.creator.displayName,
              totalCents: deal.brandTotalCents,
              draftDueAt: deal.draftDueAt,
              draftReviewDueAt: deal.draftReviewDueAt,
              revisionDueAt: deal.revisionDueAt,
              postWindowEnd: deal.postWindowEnd,
              scheduledFor: deal.scheduledFor,
              verificationEndsAt: deal.verificationEndsAt,
              graceUntil: deal.graceUntil,
              proofPending: false,
              payoutBlocked: !interest.creator.stripeOnboarded,
            },
            locale,
          );
          return (
            <Link key={deal.id} href={`/dashboard/deals/${deal.id}`} className={`${cardClass} block transition hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 ${highlight ? "ring-1 ring-ink" : ""}`}>
              <div className="flex items-center gap-3">
                <Avatar src={other.avatarUrl} name={name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{name}</p>
                  <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{interest.request.title}</p>
                </div>
                <Badge strong={highlight}>{u(`status.${deal.status}`)}</Badge>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <p className="font-bold tabular-nums">{formatCents(deal.brandTotalCents ?? interest.amountCents ?? 0)}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDealDate(deal.statusChangedAt, locale)}</p>
              </div>
              {!isTerminal(deal.status) && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{u(step.key, step.vars)}</p>}
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
