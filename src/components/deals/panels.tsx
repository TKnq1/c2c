import Link from "next/link";
import type { DealStatus } from "@prisma/client";
import { IoChatbubbleOutline, IoChevronBack, IoDocumentTextOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { CompletePaymentButton } from "@/components/complete-payment-button";
import { ConfirmPostButton, ConfirmUsageButton, ContinueContractButton, DeliverUsageForm, OpenDisputeButton, RecheckButton, ReviewDraftForm, ScheduleForm, SignContractButton, SubmitDraftForm, SubmitPostForm, CancelDealButton } from "@/components/deals/forms";
import { Badge, Row, Section, cardClass } from "@/components/deals/ui";
import { USAGE_CHANNELS, isUsageChannel, usageState } from "@/lib/compliance/usage-rights";
import type { DealLocale } from "@/lib/deals/copy";
import type { FieldIssue } from "@/lib/deals/action-state";
import { CANCEL_REASON_TEXT, formatDealDate } from "@/lib/deals/notices";
import { disputeReasonText } from "@/lib/deals/payout";
import type { CancelReason } from "@/lib/deals/policy";
import { parseTaxSnapshot } from "@/lib/deals/parties";
import type { DealPageData } from "@/lib/deals/queries";
import { LIFECYCLE_STAGES, allowedActions, stageOf } from "@/lib/deals/status";
import type { DealTerms } from "@/lib/deals/terms";
import { UI_WORDS, type UiKey, type UiText } from "@/lib/deals/ui-copy";
import { canCheckByLink } from "@/lib/deals/verification";
import { formatCents } from "@/lib/format";
import { POST_FORMATS, isPostFormat } from "@/lib/social/platforms";

export type PanelContext = {
  data: DealPageData;
  terms: DealTerms;
  role: "STARTUP" | "CREATOR";
  userId: string;
  u: UiText;
  locale: DealLocale;
};

const date = (value: Date | null, locale: DealLocale) => (value ? formatDealDate(value, locale) : "—");

// ---------------------------------------------------------------------------------------------------------------------

export function DealHeader({ data, role, u, locale }: PanelContext) {
  const { interest } = data;
  const other = role === "STARTUP" ? interest.creator : interest.request.startup;
  const name = "displayName" in other ? other.displayName : other.companyName;
  return (
    <div className="flex flex-col gap-3">
      <Link href="/dashboard/deals" className="inline-flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-ink dark:text-neutral-400">
        <IoChevronBack className="h-4 w-4" aria-hidden />
        {u("deal.back")}
      </Link>
      <div className="flex items-center gap-3">
        <Avatar src={other.avatarUrl} name={name} size={48} />
        <div className="min-w-0 flex-1">
          <h1 className="break-words font-display text-title-2 font-bold">{interest.request.title}</h1>
          <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{u("deal.with", { name })}</p>
        </div>
        <Badge strong={data.status === "DISPUTED"}>{u(`status.${data.status}`)}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-bold tabular-nums">{formatCents(data.brandTotalCents ?? (interest.amountCents ?? 0))}</span>
        <Link href={`/dashboard/messages/${interest.id}`} className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-ink dark:text-neutral-400">
          <IoChatbubbleOutline className="h-4 w-4" aria-hidden />
          {u("deal.chat")}
        </Link>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{date(data.createdAt, locale)}</span>
      </div>
    </div>
  );
}

export function Stepper({ data, u }: Pick<PanelContext, "data" | "u">) {
  const current = stageOf(data.status, data.statusBeforeDispute);
  const index = LIFECYCLE_STAGES.indexOf(current);
  const stopped = data.status === "CANCELLED" || data.status === "DISPUTED";
  return (
    <ol className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 text-xs" aria-label="Lifecycle">
      {LIFECYCLE_STAGES.map((stage, i) => {
        const done = i < index || data.status === "COMPLETED";
        const active = i === index && data.status !== "COMPLETED";
        return (
          <li
            key={stage}
            aria-current={active ? "step" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 ${
              active ? (stopped ? "border border-ink font-semibold" : "bg-ink font-semibold text-paper") : done ? "bg-fog text-ink" : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            <span aria-hidden>{done ? "✓" : i + 1}</span>
            {u(`stage.${stage}`)}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

// bare: only the card, for a place that brings its own heading (the collapsed contract on the deal page).
export function ContractPanel({ ctx, clashes, bare = false }: { ctx: PanelContext; clashes: FieldIssue[]; bare?: boolean }) {
  const { data, terms, role, u } = ctx;
  const snapshot = parseTaxSnapshot(data.taxSnapshot);
  const signedAt = role === "STARTUP" ? data.brandSignedAt : data.creatorSignedAt;
  const otherSignedAt = role === "STARTUP" ? data.creatorSignedAt : data.brandSignedAt;
  const otherName = role === "STARTUP" ? terms.creatorName : terms.brandName;
  const w = terms.workflow;
  const ex = terms.exclusivity;
  const us = terms.usage;
  const channels = us.channels.map((c) => (isUsageChannel(c) ? USAGE_CHANNELS[c].label : c)).join(", ");
  // The figures as they stand now: a side that went Pro since the offer moved the fee down.
  const payoutCents = data.interest.payoutCents ?? terms.payoutCents;
  const feeCents = data.interest.platformFeeCents ?? terms.platformFeeCents;
  const exScope = [...(ex.categories.length > 0 ? ex.categories : [terms.productCategory]), ...ex.competitors].join(", ");

  const card = (
      <div className={cardClass}>
        <dl className="divide-y divide-neutral-200 dark:divide-neutral-700">
          <Row label={u("contract.price")}>{formatCents(terms.amountCents)}</Row>
          {role === "STARTUP" &&
            (snapshot ? (
              <>
                <Row label={u("contract.vat", { rate: snapshot.tax.brand.rateBp / 100 })}>{formatCents(snapshot.tax.brand.vatCents)}</Row>
                <Row label={u("tax.treatment")}>{u(`tax.${snapshot.tax.brand.treatment}`)}</Row>
                <Row label={u("contract.total")}>{formatCents(snapshot.tax.brand.totalCents)}</Row>
              </>
            ) : (
              <p className="py-1.5 text-xs text-neutral-500 dark:text-neutral-400">{u("contract.vatPending")}</p>
            ))}
          {role === "CREATOR" && (
            <>
              <Row label={u("contract.fee")}>
                {formatCents(feeCents)} ({Math.round((feeCents / Math.max(terms.amountCents, 1)) * 1000) / 10} %)
              </Row>
              <Row label={u("contract.payout")}>{formatCents(payoutCents)}</Row>
              {snapshot && <Row label={u("tax.treatment")}>{u(`tax.${snapshot.tax.creator.treatment}`)}</Row>}
            </>
          )}
          <Row label={u("contract.formats")}>{terms.contentFormats.map((f) => POST_FORMATS[f].label).join(", ")}</Row>
          <Row label={u("contract.market")}>{terms.targetMarket}</Row>
          <Row label={u("contract.labels")}>{terms.disclosure.labels.join(" / ")}</Row>
          {terms.disclosure.requirePaidPartnershipLabel && <Row label={u("contract.partnershipLabel")}>✓</Row>}
          {terms.requiredHashtags.length > 0 && <Row label={u("contract.hashtags")}>{terms.requiredHashtags.map((t) => `#${t}`).join(" ")}</Row>}
          {terms.requiredMentions.length > 0 && <Row label={u("contract.mentions")}>{terms.requiredMentions.map((m) => `@${m}`).join(" ")}</Row>}
          <Row label={u("contract.workflow")}>
            {w.draftRequired ? u("contract.draftRequired", { days: w.brandReviewDays, rounds: w.maxRevisionRounds }) : u("contract.noDraft")}
          </Row>
          <Row label={u("contract.window")}>
            {w.postingWindowEnd ? `${w.postingWindowStart ? `${w.postingWindowStart} – ` : "… – "}${w.postingWindowEnd}` : u("contract.windowFlexible", { days: 30 })}
          </Row>
          <Row label={u("contract.minLive")}>{w.minLiveHours >= 48 && w.minLiveHours % 24 === 0 ? u("contract.days", { count: w.minLiveHours / 24 }) : u("contract.hours", { count: w.minLiveHours })}</Row>
          <Row label={u("contract.exclusivity")}>
            {ex.enabled ? u("contract.exclusivityScope", { scope: exScope, before: ex.daysBefore, after: ex.daysAfter }) : u("contract.exclusivityNone")}
          </Row>
          <Row label={u("contract.usage")}>
            {us.type === "ORGANIC_ONLY"
              ? u("contract.usageOrganic")
              : us.type === "CROSS_POST"
                ? u("contract.usageCross", { days: us.durationDays ?? 0 })
                : u("contract.usagePaid", { days: us.durationDays ?? 0, channels, territory: us.territory, fee: formatCents(us.feeCents ?? 0) })}
          </Row>
        </dl>

        {terms.talkingPoints && (
          <p className="mt-3 text-sm">
            <span className="font-medium">{u("contract.talkingPoints")}: </span>
            {terms.talkingPoints}
          </p>
        )}
        {terms.doNots && (
          <p className="mt-2 text-sm">
            <span className="font-medium">{u("contract.doNots")}: </span>
            {terms.doNots}
          </p>
        )}

        {clashes.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 rounded border border-neutral-300 p-3 text-sm dark:border-neutral-700">
            {clashes.map((c) => (
              <li key={c.message}>
                <span className="font-medium">{u("contract.exclusivityWarning")}: </span>
                {c.message}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          {u("contract.termsId")}: <span className="font-mono">{data.termsHash.slice(0, 12)}</span> ·{" "}
          {signedAt ? u("contract.signedBy", { name: role === "STARTUP" ? terms.brandName : terms.creatorName }) : null}
          {signedAt && otherSignedAt ? " · " : null}
          {otherSignedAt ? u("contract.signedBy", { name: otherName }) : u("contract.notSigned", { name: otherName })}
        </p>

        {data.status === "CONTRACT_PENDING" && signedAt && otherSignedAt && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("contract.continueHint")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <ContinueContractButton dealId={data.id} termsHash={data.termsHash} />
              <Link href="/dashboard/business" className="text-sm underline">
                {u("deals.businessLink")}
              </Link>
            </div>
          </div>
        )}
        {data.status === "CONTRACT_PENDING" && !signedAt && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("contract.signHint")}</p>
            <SignContractButton dealId={data.id} termsHash={data.termsHash} />
          </div>
        )}
      </div>
  );
  if (bare) return card;
  return (
    <Section title={u("contract.title")} description={u("contract.intro")}>
      {card}
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

export function EscrowPanel({ ctx }: { ctx: PanelContext }) {
  const { data, role, u } = ctx;
  const status = data.interest.paymentStatus;
  if (data.status === "CONTRACT_PENDING" || (data.status === "CANCELLED" && status !== "REFUNDED")) return null;
  const total = data.brandTotalCents ?? data.interest.amountCents ?? 0;
  return (
    <Section title={u("escrow.title")}>
      <div className={cardClass}>
        {data.status === "AWAITING_ESCROW" ? (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("escrow.explain")}</p>
            <p className="mt-2 text-sm font-medium">{u("escrow.waiting")}</p>
            {role === "STARTUP" && <CompletePaymentButton interestId={data.interest.id} label={u("escrow.pay", { amount: formatCents(total) })} />}
          </>
        ) : (
          <p className="text-sm font-medium">
            {status === "HELD" && u("escrow.held", { amount: formatCents(total) })}
            {status === "RELEASED" && u("escrow.released")}
            {status === "REFUNDED" && u("escrow.refunded", { amount: formatCents(total) })}
          </p>
        )}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

export function DraftsPanel({ ctx }: { ctx: PanelContext }) {
  const { data, terms, role, u, locale } = ctx;
  if (!terms.workflow.draftRequired) return null;
  if (["CONTRACT_PENDING", "AWAITING_ESCROW"].includes(data.status) && data.drafts.length === 0) return null;
  const roundsLeft = Math.max(terms.workflow.maxRevisionRounds - data.revisionRound, 0);
  const canSubmit = role === "CREATOR" && (data.status === "IN_PRODUCTION" || data.status === "CHANGES_REQUESTED");
  const canReview = role === "STARTUP" && data.status === "DRAFT_SUBMITTED";

  return (
    <Section title={u("drafts.title")}>
      <div className={`${cardClass} flex flex-col gap-4`}>
        {data.drafts.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-400">{u("drafts.none")}</p>}
        {data.drafts.map((draft) => (
          <div key={draft.id} className="text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">
                {u("drafts.version", { version: draft.version })} · {u(`drafts.kind.${draft.kind}`)}
              </p>
              <Badge strong={draft.status === "SUBMITTED"}>{u(`drafts.status.${draft.status}`)}</Badge>
            </div>
            {draft.url && (
              <a href={draft.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block truncate underline">
                {draft.url}
              </a>
            )}
            {draft.notes && <p className="mt-1 whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">{draft.notes}</p>}
            {draft.caption && <p className="mt-1 whitespace-pre-wrap rounded border border-neutral-200 p-2 text-xs dark:border-neutral-700">{draft.caption}</p>}
            {draft.feedback && <p className="mt-1 font-medium">“{draft.feedback}”</p>}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {date(draft.submittedAt, locale)}
              {draft.autoApproved ? ` · ${u("drafts.autoApproved")}` : ""}
              {draft.status === "SUBMITTED" && data.draftReviewDueAt ? ` · ${u("drafts.reviewBy", { date: date(data.draftReviewDueAt, locale) })}` : ""}
            </p>
          </div>
        ))}
        {canSubmit && <SubmitDraftForm dealId={data.id} revising={data.status === "CHANGES_REQUESTED"} />}
        {canReview && <ReviewDraftForm dealId={data.id} canRequestChanges={roundsLeft > 0} roundsLeft={roundsLeft} />}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

const POST_STAGES: DealStatus[] = ["DRAFT_APPROVED", "POST_SCHEDULED", "POST_SUBMITTED", "REPOST_REQUIRED"];

export function PostsPanel({ ctx }: { ctx: PanelContext }) {
  const { data, terms, role, u, locale } = ctx;
  const status = data.status;
  const reachable = POST_STAGES.includes(status) || (status === "IN_PRODUCTION" && !terms.workflow.draftRequired);
  const hasPosts = data.posts.length > 0;
  if (!reachable && !hasPosts && !["VERIFYING", "PAYOUT_PENDING", "COMPLETED", "DISPUTED"].includes(status)) return null;

  const proofFormats = terms.contentFormats.filter((f) => POST_FORMATS[f].verification === "proof" || !canCheckByLink(f));
  const canSchedule = role === "CREATOR" && (status === "DRAFT_APPROVED" || status === "POST_SCHEDULED" || (status === "IN_PRODUCTION" && !terms.workflow.draftRequired));
  const canReport = role === "CREATOR" && reachable;
  const canRecheck = ["POST_SUBMITTED", "VERIFYING", "REPOST_REQUIRED"].includes(status);

  return (
    <Section
      title={u("posts.title")}
      action={canRecheck ? <RecheckButton dealId={data.id} /> : undefined}
      description={status === "VERIFYING" && data.verificationEndsAt ? u("posts.holdUntil", { date: date(data.verificationEndsAt, locale) }) : undefined}
    >
      <div className={`${cardClass} flex flex-col gap-4`}>
        {!hasPosts && <p className="text-sm text-neutral-500 dark:text-neutral-400">{u("posts.none")}</p>}
        {data.scheduledFor && ["POST_SCHEDULED", "POST_SUBMITTED"].includes(status) && !hasPosts && (
          <p className="text-sm font-medium">{u("posts.scheduledFor", { date: date(data.scheduledFor, locale) })}</p>
        )}
        {data.posts.map((post) => {
          const info = isPostFormat(post.format) ? POST_FORMATS[post.format] : null;
          const metric = post.metrics[0];
          const proofPending = post.source === "PROOF" && post.status === "PENDING";
          return (
            <div key={post.id} className="text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{info?.label ?? post.format}</p>
                <Badge strong={post.status === "VERIFIED"}>{u(`posts.status.${post.status}`)}</Badge>
              </div>
              {post.url && (
                <a href={post.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block truncate underline">
                  {post.url}
                </a>
              )}
              {post.caption && <p className="mt-1 whitespace-pre-wrap rounded border border-neutral-200 p-2 text-xs dark:border-neutral-700">{post.caption}</p>}
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {post.publishedAt ? `${u("posts.publishedAt")} ${date(post.publishedAt, locale)} · ` : ""}
                {u(`posts.source.${post.source}`)}
                {post.lastCheckedAt ? ` · ${u("posts.lastChecked", { date: date(post.lastCheckedAt, locale) })}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {post.disclosureLabel ? u("posts.label", { label: post.disclosureLabel }) : info?.kind !== "story" ? u("posts.labelMissing") : null}
                {post.paidPartnershipLabel ? ` · ${u("posts.partnershipOn")}` : ""}
                {metric?.views != null ? ` · ${u("posts.views", { count: metric.views.toLocaleString(locale === "de" ? "de-DE" : "en-GB") })}` : ""}
                {metric?.likes != null ? ` · ${u("posts.likes", { count: metric.likes.toLocaleString(locale === "de" ? "de-DE" : "en-GB") })}` : ""}
              </p>
              {post.proofs.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {post.proofs.map((proof) => (
                    <a key={proof.id} href={`/api/deals/${data.id}/proofs/${proof.id}`} target="_blank" rel="noopener noreferrer" aria-label={u("posts.proof")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/deals/${data.id}/proofs/${proof.id}`} alt={u("posts.proof")} className="h-24 w-auto rounded border border-neutral-200 object-cover dark:border-neutral-700" />
                    </a>
                  ))}
                </div>
              )}
              {role === "STARTUP" && proofPending && status === "POST_SUBMITTED" && (
                <div className="mt-2 flex flex-col gap-1">
                  <ConfirmPostButton postId={post.id} />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {u("posts.confirmBy", { date: date(new Date(post.submittedAt.getTime() + terms.workflow.brandReviewDays * 86_400_000), locale) })}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {canSchedule && !hasPosts && (
          <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-sm font-medium">{u("posts.scheduleTitle")}</p>
            {data.scheduledFor && <p className="mb-2 text-sm">{u("posts.scheduledFor", { date: date(data.scheduledFor, locale) })}</p>}
            <ScheduleForm dealId={data.id} rescheduling={status === "POST_SCHEDULED"} />
          </div>
        )}
        {canReport && (
          <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-sm font-medium">{u("posts.reportTitle")}</p>
            <SubmitPostForm
              dealId={data.id}
              terms={{
                formats: terms.contentFormats,
                market: terms.targetMarket,
                labels: terms.disclosure.labels,
                requirePaidPartnershipLabel: terms.disclosure.requirePaidPartnershipLabel,
                requiredHashtags: terms.requiredHashtags,
                requiredMentions: terms.requiredMentions,
                proofFormats,
                reportedFormats: data.posts.filter((post) => post.status !== "REMOVED" && post.status !== "REJECTED").map((post) => post.format),
              }}
            />
          </div>
        )}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

export function UsagePanel({ ctx }: { ctx: PanelContext }) {
  const { data, terms, role, u, locale } = ctx;
  const us = terms.usage;
  if (us.type === "ORGANIC_ONLY") return null;
  const state = usageState(us, { startsAt: data.usageStartsAt, expiresAt: data.usageExpiresAt }, new Date());
  const canDeliver =
    role === "CREATOR" && us.type === "PAID_ADS" && !data.usageDeliveredAt && ["POST_SUBMITTED", "VERIFYING", "REPOST_REQUIRED", "PAYOUT_PENDING"].includes(data.status);

  return (
    <Section title={u("usage.title")}>
      <div className={`${cardClass} flex flex-col gap-3 text-sm`}>
        <p className="font-medium">{u(`usage.state.${state}`, { date: date(data.usageExpiresAt, locale) })}</p>
        {us.type === "PAID_ADS" && (
          <>
            <p className="text-neutral-600 dark:text-neutral-400">
              {data.usageDeliveredAt ? u("usage.deliveredAt", { date: date(data.usageDeliveredAt, locale) }) : u("usage.notDelivered")}
            </p>
            {data.sparkAdsCode && role === "STARTUP" && <p className="font-mono text-xs break-all">{u("usage.code", { code: data.sparkAdsCode })}</p>}
            {role === "STARTUP" && data.usageDeliveredAt && !data.usageConfirmedAt && <ConfirmUsageButton dealId={data.id} />}
          </>
        )}
        {canDeliver && (
          <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
            <p className="mb-2 font-medium">{u("usage.deliverTitle")}</p>
            <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">{u("usage.deliverHint")}</p>
            <DeliverUsageForm dealId={data.id} channels={us.channels} />
          </div>
        )}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

export function DisputePanel({ ctx }: { ctx: PanelContext }) {
  const { data, role, u, locale } = ctx;
  const canOpen = allowedActions(data.status, role).includes("OPEN_DISPUTE");
  if (data.disputes.length === 0 && !canOpen) return null;
  return (
    <Section title={u("dispute.title")}>
      <div className={`${cardClass} flex flex-col gap-3 text-sm`}>
        {data.disputes.map((d) => (
          <div key={d.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{disputeReasonText(d.reason, locale)}</p>
              <Badge strong={d.status === "OPEN"}>{u(`dispute.status.${d.status}`)}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {u("dispute.openedBy", { who: d.openedByRole ? u(`event.by.${d.openedByRole}`) : u("dispute.bySystem"), date: date(d.openedAt, locale) })}
            </p>
            {d.details && <p className="mt-1 whitespace-pre-wrap">{d.details}</p>}
            {d.resolution && <p className="mt-1 font-medium">{u("dispute.resolution", { text: d.resolution })}</p>}
          </div>
        ))}
        {canOpen && <OpenDisputeButton dealId={data.id} />}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

export function InvoicesPanel({ ctx }: { ctx: PanelContext }) {
  const { data, userId, u, locale } = ctx;
  if (data.status !== "COMPLETED") return null;
  const mine = data.invoices.filter((i) => i.recipientUserId === userId);
  return (
    <Section title={u("invoices.title")}>
      <div className={`${cardClass} flex flex-col gap-2`}>
        {mine.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-400">{u("invoices.none")}</p>}
        {mine.map((invoice) => (
          <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className="flex items-center gap-3 text-sm hover:underline">
            <IoDocumentTextOutline className="h-5 w-5 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">
              {u(`invoices.kind.${invoice.kind}`)} {invoice.number}
            </span>
            <span className="tabular-nums">{formatCents(invoice.grossCents)}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{date(invoice.issuedAt, locale).split(",")[0]}</span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------

export function TimelinePanel({ ctx }: { ctx: PanelContext }) {
  const { data, u, locale } = ctx;
  const known = (key: string): key is UiKey => key in UI_WORDS;
  return (
    <Section title={u("deal.timeline")}>
      <ol className="flex flex-col gap-2 px-1 text-sm">
        {data.events.length === 0 && <li className="text-neutral-500 dark:text-neutral-400">{u("deal.noEvents")}</li>}
        {data.events.map((event) => {
          const direct = `event.${event.kind}`;
          const byStatus = event.toStatus ? `event.status.${event.toStatus}` : "";
          let text: string;
          if (event.kind.startsWith("cancelled.")) {
            const reason = event.kind.slice("cancelled.".length) as CancelReason;
            text = `${u("event.cancelled")}${CANCEL_REASON_TEXT[reason] ? `: ${CANCEL_REASON_TEXT[reason][locale]}` : ""}`;
          } else if (known(direct)) text = u(direct);
          else if (known(byStatus)) text = u(byStatus);
          else if (event.toStatus) text = u(`status.${event.toStatus}`);
          else text = event.kind;
          return (
            <li key={event.id} className="flex gap-3">
              <span className="w-32 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">{date(event.createdAt, locale)}</span>
              <span className="min-w-0 flex-1">
                {text}
                <span className="text-neutral-500 dark:text-neutral-400"> · {u(`event.by.${event.actorRole ?? "SYSTEM"}`)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function CancelPanel({ ctx, funded }: { ctx: PanelContext; funded: boolean }) {
  const { data, role } = ctx;
  const draftCount = data.drafts.length;
  const status = data.status;
  const brandMay = status === "CONTRACT_PENDING" || status === "AWAITING_ESCROW" || (status === "IN_PRODUCTION" && draftCount === 0);
  const creatorMay = ["CONTRACT_PENDING", "AWAITING_ESCROW", "IN_PRODUCTION", "CHANGES_REQUESTED", "DRAFT_APPROVED", "POST_SCHEDULED"].includes(status);
  if (role === "STARTUP" ? !brandMay : !creatorMay) return null;
  return <CancelDealButton dealId={data.id} funded={funded} />;
}
