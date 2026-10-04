import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { ChatOfferCard, MakeOfferButton, type ChatOffer } from "@/components/chat-offer";
import { PaymentStatusBadge, paymentStage } from "@/components/payment-status-badge";
import { LocalDate } from "@/components/local-date";
import { formatBudget, formatCents, formatPostBy } from "@/lib/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { categoryLabel, presetLabel } from "@/lib/i18n/labels";

type Props = {
  interestId: string;
  other: { name: string; avatarUrl: string | null; href: string };
  request: {
    title: string;
    // The brand's own request page; creators have none to open.
    href: string | null;
    budgetMinCents: number | null;
    budgetMaxCents: number | null;
    platform: string | null;
    deliverables: string | null;
    postBy: Date | null;
    productIncluded: boolean;
    productCategory: string;
  };
  offer: ChatOffer | null;
  // Set when the viewer (a brand) can open the negotiation.
  makeOffer: { feeRatePercent: number } | null;
  // What a creator sees before a brand has made an offer.
  waitingOn: string;
  deposit: { status: string; amountCents: number } | null;
  startedAt: number;
  disputedAt: Date | null;
};

const ROW = "flex items-center justify-between gap-3 border-ink/10 py-2 [&+&]:border-t";

// The chat's right column on wide screens (xl), like a support inbox's
// details pane: who it's with, which request it's about, and where the
// offer and payment stand, with that stage's action — the same card the
// conversation shows, so both stay in step.
export async function ChatInfoPanel({ interestId, other, request, offer, makeOffer, waitingOn, deposit, startedAt, disputedAt }: Props) {
  const t = await getT();
  const locale = await getLocale();
  const budget = formatBudget(request.budgetMinCents, request.budgetMaxCents);

  return (
    <aside aria-label={t("screens.messages.collabDetails")} className="hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-ink/10 pl-6 xl:flex">
      <Link href={other.href} className="flex items-center gap-3 rounded transition hover:opacity-80">
        <Avatar src={other.avatarUrl} name={other.name} size={44} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{other.name}</span>
          <span className="block text-footnote text-neutral-500 dark:text-neutral-400">{t("screens.messages.viewProfile")}</span>
        </span>
      </Link>

      <section className="flex flex-col gap-2">
        <h2 className="text-footnote text-neutral-500 dark:text-neutral-400">{t("screens.requests.request")}</h2>
        <div className="rounded bg-fog px-4 py-3">
          {request.href ? (
            <Link href={request.href} className="font-semibold hover:underline">
              {request.title}
            </Link>
          ) : (
            <p className="font-semibold">{request.title}</p>
          )}
          <dl className="mt-1 text-sm">
            {budget && (
              <div className={ROW}>
                <dt className="text-neutral-500 dark:text-neutral-400">{t("screens.requests.budget")}</dt>
                <dd className="font-semibold tabular-nums">{budget}</dd>
              </div>
            )}
            {request.platform && request.deliverables && (
              <div className={ROW}>
                <dt className="text-neutral-500 dark:text-neutral-400">{t("screens.requests.content")}</dt>
                <dd className="flex min-w-0 items-center gap-1.5 text-right">
                  <PlatformIcon platform={request.platform} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{presetLabel(t, request.deliverables)}</span>
                </dd>
              </div>
            )}
            <div className={ROW}>
              <dt className="text-neutral-500 dark:text-neutral-400">{t("screens.requests.postBy")}</dt>
              <dd>{request.postBy ? formatPostBy(request.postBy, locale) : t("screens.requests.flexible")}</dd>
            </div>
            <div className={ROW}>
              <dt className="text-neutral-500 dark:text-neutral-400">{t("screens.requests.product")}</dt>
              <dd className="truncate text-right">
                {request.productIncluded
                  ? `${categoryLabel(t, request.productCategory)} · ${t("screens.requests.included")}`
                  : categoryLabel(t, request.productCategory)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-footnote text-neutral-500 dark:text-neutral-400">{t("screens.messages.offerPayment")}</h2>
          {offer && <PaymentStatusBadge status={paymentStage({ paymentStatus: offer.status, proofSubmittedAt: offer.proofSubmittedAt, disputedAt })} />}
        </div>
        <div className="rounded bg-fog p-1">
          {offer ? (
            <ChatOfferCard interestId={interestId} offer={offer} timeLabel="" isNew={false} variant="panel" />
          ) : makeOffer ? (
            <div className="flex flex-col gap-3 p-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t("screens.messages.noOffer")}
              </p>
              <MakeOfferButton
                interestId={interestId}
                feeRatePercent={makeOffer.feeRatePercent}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite"
              />
            </div>
          ) : (
            <p className="p-3 text-sm text-neutral-600 dark:text-neutral-400">{waitingOn}</p>
          )}
        </div>
        {deposit && (
          <p className="px-1 text-footnote text-neutral-500 dark:text-neutral-400">
            {t("screens.messages.depositLine", { amount: formatCents(deposit.amountCents), status: deposit.status.toLowerCase() })}
          </p>
        )}
      </section>

      <p className="text-footnote text-neutral-500 dark:text-neutral-400">
        {t("screens.messages.started")} <LocalDate ms={startedAt} />
      </p>
    </aside>
  );
}
