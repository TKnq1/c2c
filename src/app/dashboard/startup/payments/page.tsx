import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageTitle } from "@/components/page-title";
import { DealsTabs } from "@/components/deals/deals-tabs";
import { BrandMoneySummary, BrandPaymentSections } from "@/components/payments/brand-payments";
import { getLocale, getT } from "@/lib/i18n/server";
import { canUseDeals } from "@/lib/deals/queries";
import { dealLocale } from "@/lib/deals/copy";
import { uiText } from "@/lib/deals/ui-copy";

// The Payments tab under Deals (the sidebar has no entry of its own where brand deals are on); without brand deals it is the
// page on its own, and it also carries the offers and interested creators the Deals list takes over otherwise.
export default async function StartupPaymentsPage(props: PageProps<"/dashboard/startup/payments">) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");
  const t = await getT();
  const locale = dealLocale(await getLocale());
  const u = uiText(locale);
  const showDeals = await canUseDeals(session.user.id, "STARTUP");

  // Set by Stripe Checkout's return URLs, see createCheckoutSessionAction.
  const searchParams = await props.searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <div className="page-wide flex flex-col gap-6">
      <PageTitle description={u("deals.paymentsDescription")}>{t("nav.payments")}</PageTitle>
      <DealsTabs current="payments" userId={session.user.id} role="STARTUP" locale={locale} />
      <BrandMoneySummary userId={session.user.id} />
      <BrandPaymentSections
        userId={session.user.id}
        checkout={first(searchParams.checkout)}
        paidInterestId={first(searchParams.interest)}
        moved={showDeals}
        locale={locale}
      />
    </div>
  );
}
