import Link from "next/link";
import { IoArrowDown } from "react-icons/io5";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { Folded, cardClass } from "@/components/deals/ui";
import { ContractPanel, DealHeader, DisputePanel, DraftsPanel, EscrowPanel, InvoicesPanel, PostsPanel, Stepper, TimelinePanel, UsagePanel, type PanelContext } from "@/components/deals/panels";
import { dealLocale } from "@/lib/deals/copy";
import { serializeIssues } from "@/lib/deals/action-state";
import { exclusivityIssuesFor } from "@/lib/deals/exclusivity";
import { nextStep } from "@/lib/deals/next-step";
import { planPanels, stepAction, type PanelSlot } from "@/lib/deals/page-plan";
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
  const action = step.mine ? stepAction(step.key) : null;
  const panel = ({ id, behind }: PanelSlot) => {
    switch (id) {
      case "escrow":
        return <EscrowPanel key={id} ctx={ctx} behind={behind} />;
      case "drafts":
        return <DraftsPanel key={id} ctx={ctx} behind={behind} />;
      case "posts":
        return <PostsPanel key={id} ctx={ctx} behind={behind} />;
      case "usage":
        return <UsagePanel key={id} ctx={ctx} />;
      case "invoices":
        return <InvoicesPanel key={id} ctx={ctx} />;
      case "dispute":
        return <DisputePanel key={id} ctx={ctx} />;
    }
  };
  // The part the deal is in comes right after the card, what is behind the deal shrinks to a line (see page-plan.ts).
  const slots = planPanels(data.status, terms.workflow.draftRequired);
  const contract = <ContractPanel ctx={ctx} clashes={clashes} bare />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-8">
      <DealHeader {...ctx} />
      <Stepper data={data} u={u} />

      <div className={`${cardClass} flex flex-col gap-2 ${step.mine ? "ring-1 ring-ink" : ""}`}>
        <p className="text-footnote text-neutral-500 dark:text-neutral-400">{u("next.title")}</p>
        <p className="font-medium">{u(step.key, step.vars)}</p>
        {action && (
          <a href={`#${action.section}`} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite">
            {u(action.label)}
            <IoArrowDown className="h-4 w-4" aria-hidden />
          </a>
        )}
        {step.key === "next.payoutBlocked" && (
          <Link href="/dashboard/creator/payments" className="w-fit rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite">
            {u("next.setupPayouts")}
          </Link>
        )}
      </div>

      {/* Until both sides have confirmed, the contract is the task and comes first. After that it is reference: one tap away
          behind the parts that are due. */}
      {data.status === "CONTRACT_PENDING" && <ContractPanel ctx={ctx} clashes={clashes} />}
      {slots.map(panel)}
      {data.status !== "CONTRACT_PENDING" && (
        <Folded id="contract" summary={u("contract.title")}>
          {contract}
        </Folded>
      )}
      <TimelinePanel ctx={ctx} />
    </div>
  );
}
