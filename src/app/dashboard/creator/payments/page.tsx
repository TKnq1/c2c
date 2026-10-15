import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageTitle } from "@/components/page-title";
import { CreatorMoneySummary, CreatorPaymentSections } from "@/components/payments/creator-payments";
import { getLocale, getT } from "@/lib/i18n/server";
import { canUseDeals } from "@/lib/deals/queries";
import { dealLocale } from "@/lib/deals/copy";
import { DEALS_HREF } from "@/lib/nav-links";

// Only without brand deals; with them this address forwards to Deals (see the brand's Payments page).
export default async function CreatorPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");
  if (await canUseDeals(session.user.id, "CREATOR")) redirect(DEALS_HREF);

  const t = await getT();
  const locale = dealLocale(await getLocale());

  return (
    <div className="page-wide flex flex-col gap-6">
      <PageTitle>{t("nav.payments")}</PageTitle>
      <CreatorMoneySummary userId={session.user.id} />
      <CreatorPaymentSections userId={session.user.id} view="page" locale={locale} />
    </div>
  );
}
