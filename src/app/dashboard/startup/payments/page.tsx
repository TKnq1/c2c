import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageTitle } from "@/components/page-title";
import { BrandMoneySummary, BrandPaymentSections } from "@/components/payments/brand-payments";
import { getLocale, getT } from "@/lib/i18n/server";
import { canUseDeals } from "@/lib/deals/queries";
import { dealLocale } from "@/lib/deals/copy";
import { DEALS_HREF } from "@/lib/nav-links";

// Only without brand deals. With them the money lives on the Deals pages: the summary under Invoices, the collabs from
// before deals on the Deals list, so this address (old notifications, Stripe's return from an older collab) forwards
// there, query and all.
export default async function StartupPaymentsPage(props: PageProps<"/dashboard/startup/payments">) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");
  const searchParams = await props.searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  // Set by Stripe Checkout's return URLs, see createCheckoutSessionAction.
  const checkout = first(searchParams.checkout);
  const paidInterestId = first(searchParams.interest);

  if (await canUseDeals(session.user.id, "STARTUP")) {
    const query = new URLSearchParams();
    if (checkout) query.set("checkout", checkout);
    if (paidInterestId) query.set("interest", paidInterestId);
    redirect(query.size > 0 ? `${DEALS_HREF}?${query}` : DEALS_HREF);
  }

  const t = await getT();
  const locale = dealLocale(await getLocale());

  return (
    <div className="page-wide flex flex-col gap-6">
      <PageTitle>{t("nav.payments")}</PageTitle>
      <BrandMoneySummary userId={session.user.id} />
      <BrandPaymentSections userId={session.user.id} view="page" checkout={checkout} paidInterestId={paidInterestId} locale={locale} />
    </div>
  );
}
