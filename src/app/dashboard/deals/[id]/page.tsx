import Link from "next/link";
import { IoChevronDown } from "react-icons/io5";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { cardClass } from "@/components/deals/ui";
import { CancelPanel, ContractPanel, DealHeader, DisputePanel, DraftsPanel, EscrowPanel, InvoicesPanel, PostsPanel, Stepper, TimelinePanel, UsagePanel, type PanelContext } from "@/components/deals/panels";
import { dealLocale } from "@/lib/deals/copy";
import { serializeIssues } from "@/lib/deals/action-state";
import { exclusivityIssuesFor } from "@/lib/deals/exclusivity";
import { nextStep } from "@/lib/deals/next-step";
import { loadDealPage } from "@/lib/deals/queries";
import { parseTerms } from "@/lib/deals/terms";
import { uiText } from "@/lib/deals/ui-copy";

export default async function DealPage(props: PageProps<"/dashboard/deals/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) redirect("/login");
  const role = session.user.role;

  const data = await loadDealPage(id);
  if (!data) notFound();
  const { interest } = data;
  const isParty = role === "STARTUP" ? interest.request.startup.userId === session.user.id : interest.creator.userId === session.user.id;
  if (!isParty) notFound();

  const locale = dealLocale(await getLocale());
  const u = uiText(locale);
  const terms = parseTerms(data.terms);
  const ctx: PanelContext = { data, terms, role, userId: session.user.id, u, locale };

  const clashes = serializeIssues(["CONTRACT_PENDING", "AWAITING_ESCROW", "IN_PRODUCTION", "DRAFT_APPROVED", "POST_SCHEDULED"].includes(data.status) ? await exclusivityIssuesFor(id) : [], locale);
  const step = nextStep(
    {
      status: data.status,
      role,
      brandSigned: data.brandSignedAt !== null,
      creatorSigned: data.creatorSignedAt !== null,
      draftRequired: terms.workflow.draftRequired,
      brandName: terms.brandName,
      creatorName: terms.creatorName,
      totalCents: data.brandTotalCents,
      draftDueAt: data.draftDueAt,
      draftReviewDueAt: data.draftReviewDueAt,
      revisionDueAt: data.revisionDueAt,
      postWindowEnd: data.postWindowEnd,
      scheduledFor: data.scheduledFor,
      verificationEndsAt: data.verificationEndsAt,
      graceUntil: data.graceUntil,
      proofPending: data.posts.some((p) => p.source === "PROOF" && p.status === "PENDING"),
      payoutBlocked: !interest.creator.stripeOnboarded,
    },
    locale,
  );
  const funded = interest.paymentStatus === "HELD";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-8">
      <DealHeader {...ctx} />
      <Stepper data={data} u={u} />

      <div className={`${cardClass} flex flex-col gap-2 ${step.mine ? "ring-1 ring-ink" : ""}`}>
        <p className="text-footnote text-neutral-500 dark:text-neutral-400">{u("next.title")}</p>
        <p className="font-medium">{u(step.key, step.vars)}</p>
        {step.key === "next.payoutBlocked" && (
          <Link href="/dashboard/creator/payments" className="w-fit rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite">
            {u("next.setupPayouts")}
          </Link>
        )}
      </div>

      {/* Until both sides have confirmed, the contract is the task. After that it is reference: one tap away, and the
          form that is due (draft, post, review) is what comes next on a phone instead of a screenful of terms. */}
      {data.status === "CONTRACT_PENDING" ? (
        <ContractPanel ctx={ctx} clashes={clashes} />
      ) : (
        <details id="contract" className={`${cardClass} group scroll-mt-6`}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            {u("contract.title")}
            <IoChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="mt-3">
            <ContractPanel ctx={ctx} clashes={clashes} bare />
          </div>
        </details>
      )}
      <EscrowPanel ctx={ctx} />
      <DraftsPanel ctx={ctx} />
      <PostsPanel ctx={ctx} />
      <UsagePanel ctx={ctx} />
      <InvoicesPanel ctx={ctx} />
      <DisputePanel ctx={ctx} />
      <CancelPanel ctx={ctx} funded={funded} />
      <TimelinePanel ctx={ctx} />
    </div>
  );
}
