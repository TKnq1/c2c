import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageTitle } from "@/components/page-title";
import { DealsTabs } from "@/components/deals/deals-tabs";
import { CreatorMoneySummary, CreatorPaymentSections } from "@/components/payments/creator-payments";
import { getLocale, getT } from "@/lib/i18n/server";
import { canUseDeals } from "@/lib/deals/queries";
import { dealLocale } from "@/lib/deals/copy";
import { uiText } from "@/lib/deals/ui-copy";

// The Payments tab under Deals (the sidebar has no entry of its own where brand deals are on); without brand deals it is the
// page on its own, and it also carries the open offers the Deals list takes over otherwise.
export default async function CreatorPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");
  const t = await getT();
  const locale = dealLocale(await getLocale());
  const u = uiText(locale);
  const showDeals = await canUseDeals(session.user.id, "CREATOR");

  return (
    <div className="page-wide flex flex-col gap-6">
      <PageTitle description={u("deals.paymentsDescription")}>{t("nav.payments")}</PageTitle>
      <DealsTabs current="payments" userId={session.user.id} role="CREATOR" locale={locale} />
      <CreatorMoneySummary userId={session.user.id} />
      <CreatorPaymentSections userId={session.user.id} moved={showDeals} locale={locale} />
    </div>
  );
}
