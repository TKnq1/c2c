import Link from "next/link";
import { formatCents } from "@/lib/format";
import { canSellProSubscription } from "@/lib/native-app-server";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import type { FoundingSide } from "@/lib/founding-limits";
import { getT } from "@/lib/i18n/server";

// The line at the top of Payments: what this account pays per payment, and the way to Pro or to managing it.
// Brands and creators both have Pro, and a payment gets the Pro rate when either side has it, so the standard
// line says that the other side's Pro counts too.
export async function ProFeeBar({
  side,
  isPro,
  foundingNumber,
  hasSubscription,
}: {
  side: FoundingSide;
  isPro: boolean;
  foundingNumber: number | null;
  hasSubscription: boolean;
}) {
  const t = await getT();
  const pro = PRO_PLATFORM_FEE_RATE * 100;
  const standard = PLATFORM_FEE_RATE * 100;
  // No Pro upsell in the store apps, see canSellProSubscription.
  const showProOffer = !isPro && (await canSellProSubscription());
  // A founding place's Pro has no subscription behind it, so there is nothing to manage (unless it also pays for one).
  const showManage = isPro && (!foundingNumber || hasSubscription);
  const plan = side === "brand" ? "/dashboard/startup/settings#plan" : "/dashboard/creator/settings#plan";

  const line = isPro
    ? foundingNumber
      ? t(side === "brand" ? "founding.feeLine" : "founding.creator.feeLine", { n: foundingNumber, pro, standard })
      : t("screens.payments.proFeeLine", { pro, standard })
    : showProOffer
      ? t("screens.payments.proOfferLine", { standard, pro, price: formatCents(PRO_SUBSCRIPTION_PRICE_CENTS) })
      : t(side === "brand" ? "screens.payments.standardFeeLine" : "screens.payments.standardFeeLineCreator", { rate: standard, pro });

  return (
    <div className="flex items-center justify-between gap-3 rounded bg-fog px-4 py-3 no-print">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">{line}</p>
      {(showManage || showProOffer) && (
        <Link
          href={plan}
          className={
            isPro
              ? "shrink-0 text-sm font-medium underline"
              : "shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite"
          }
        >
          {isPro ? t("screens.payments.manage") : t("screens.payments.goPro")}
        </Link>
      )}
    </div>
  );
}
