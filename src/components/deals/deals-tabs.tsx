import Link from "next/link";
import type { Role } from "@prisma/client";
import type { DealLocale } from "@/lib/deals/copy";
import { canUseDeals } from "@/lib/deals/queries";
import { uiText } from "@/lib/deals/ui-copy";
import { getBrandPendingPaymentActionCount, getPendingPaymentActionCount } from "@/lib/payments";
import { DEALS_HREF, INVOICES_HREF, paymentsHrefOf } from "@/lib/nav-links";

export type DealsTab = "active" | "payments" | "invoices";

// The three pages behind the Deals tab: the deals themselves, the payments page and the invoices. The tab bar has one entry for
// all of them (see tabLinks), so this is how they reach each other. Only where brand deals are available.
export async function DealsTabs({ current, userId, role, locale }: { current: DealsTab; userId: string; role: Role; locale: DealLocale }) {
  if (role !== "STARTUP" && role !== "CREATOR") return null;
  if (!(await canUseDeals(userId, role))) return null;
  const u = uiText(locale);
  const waiting = role === "CREATOR" ? await getPendingPaymentActionCount(userId) : await getBrandPendingPaymentActionCount(userId);

  const tabs: { id: DealsTab; href: string; label: string; badge: number }[] = [
    { id: "active", href: DEALS_HREF, label: u("deals.tab.active"), badge: 0 },
    { id: "payments", href: paymentsHrefOf(role), label: u("deals.tab.payments"), badge: waiting },
    { id: "invoices", href: INVOICES_HREF, label: u("deals.tab.invoices"), badge: 0 },
  ];

  return (
    <nav aria-label={u("deals.tabs")} className="grid w-full max-w-md grid-cols-3 rounded bg-fog p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          prefetch={false}
          aria-current={tab.id === current ? "page" : undefined}
          className={`flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            tab.id === current ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100" : "text-neutral-500 hover:text-ink dark:text-neutral-400"
          }`}
        >
          {tab.label}
          {tab.badge > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">{tab.badge > 9 ? "9+" : tab.badge}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
