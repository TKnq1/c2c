import type { Role } from "@prisma/client";
import { ChatLink, PaymentRow } from "@/components/payment-row";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { ActionButton } from "@/components/action-button";
import { MakeOfferButton, OfferResponseButtons } from "@/components/chat-offer";
import { primaryButton, quietButton } from "@/components/deals/ui";
import { withdrawOfferAction } from "@/lib/actions/payments";
import { isOfferMyTurn } from "@/lib/deals/list-filter";
import type { OpenOffer } from "@/lib/deals/offers";
import { formatCents } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { feeRatePercent } from "@/lib/payment-math";

// The steps before a deal on the Deals list: open offers (to answer, or to withdraw while the other side thinks) and, for a brand,
// interested creators to make an offer to. Same rows as the Payments page had for them, so nothing changes in how they work.

const requestHref = (requestId: string) => `/dashboard/startup/requests/${requestId}`;

function otherSide(offer: OpenOffer, role: Role) {
  return role === "STARTUP"
    ? { name: offer.creator.displayName, avatarUrl: offer.creator.avatarUrl }
    : { name: offer.request.startup.companyName, avatarUrl: offer.request.startup.avatarUrl };
}

// The fee rate the offer was made at; stored per offer, so a later Pro plan doesn't rewrite it.
const feePercentOf = (o: OpenOffer) => Math.round((o.platformFeeCents! / o.amountCents!) * 100);

export async function OfferCards({ offers, role }: { offers: OpenOffer[]; role: Role }) {
  const t = await getT();
  // The ones to answer first.
  const sorted = [...offers].sort((a, b) => Number(isOfferMyTurn(b, role)) - Number(isOfferMyTurn(a, role)));
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((o) => {
        const { name, avatarUrl } = otherSide(o, role);
        const toAnswer = isOfferMyTurn(o, role);
        const detail =
          role === "STARTUP"
            ? t(toAnswer ? "screens.payments.copy.counteredFee" : "screens.payments.copy.waitingFee", {
                name,
                payout: formatCents(o.payoutCents!),
                fee: feePercentOf(o),
              })
            : toAnswer
              ? t("screens.payments.copy.youdGetEscrow", { payout: formatCents(o.payoutCents!) })
              : t("screens.payments.copy.counterWaiting", { name });
        return (
          <PaymentRow
            key={o.id}
            avatarUrl={avatarUrl}
            name={name}
            title={o.request.title}
            titleHref={role === "STARTUP" ? requestHref(o.requestId) : undefined}
            headerAction={<ChatLink interestId={o.id} name={name} />}
            badge={<PaymentStatusBadge status="OFFERED" />}
            amount={formatCents(o.amountCents!)}
            detail={detail}
            highlight={toAnswer}
            compact
          >
            {toAnswer ? (
              <OfferResponseButtons interestId={o.id} otherPartyName={name} amountCents={o.amountCents ?? 0} />
            ) : (
              <div className="mt-2">
                <ActionButton
                  action={withdrawOfferAction.bind(null, o.id)}
                  successMessage={t(role === "STARTUP" ? "screens.payments.copy.offerWithdrawn" : "screens.payments.copy.counterWithdrawn")}
                  className={quietButton}
                >
                  {t(role === "STARTUP" ? "screens.payments.copy.withdrawOffer" : "screens.payments.copy.withdrawCounter")}
                </ActionButton>
              </div>
            )}
          </PaymentRow>
        );
      })}
    </div>
  );
}

export function InterestedCards({ interested }: { interested: OpenOffer[] }) {
  return (
    <div className="flex flex-col gap-2">
      {interested.map((i) => (
        <PaymentRow
          key={i.id}
          avatarUrl={i.creator.avatarUrl}
          name={i.creator.displayName}
          title={i.request.title}
          titleHref={requestHref(i.requestId)}
          headerAction={<ChatLink interestId={i.id} name={i.creator.displayName} />}
        >
          <div className="mt-3">
            <MakeOfferButton
              interestId={i.id}
              feeRatePercent={feeRatePercent(i.request.startup, i.creator)}
              className={`${primaryButton} inline-flex w-full items-center justify-center gap-1.5 sm:w-auto`}
            />
          </div>
        </PaymentRow>
      ))}
    </div>
  );
}
