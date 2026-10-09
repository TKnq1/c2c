import Link from "next/link";
import type { Role } from "@prisma/client";
import { IoArrowForward, IoBriefcase } from "react-icons/io5";
import { dealLocale } from "@/lib/deals/copy";
import { canUseDeals, getDealActionCount } from "@/lib/deals/queries";
import { uiText } from "@/lib/deals/ui-copy";
import { getLocale } from "@/lib/i18n/server";
import { DEALS_HREF } from "@/lib/nav-links";

// On the home screens: "3 deals are waiting for you", straight to the list of exactly those. Nothing where nothing waits or where
// brand deals are not available to the person.
export async function DealsWaitingCard({ userId, role }: { userId: string; role: Role }) {
  if (role !== "STARTUP" && role !== "CREATOR") return null;
  if (!(await canUseDeals(userId, role))) return null;
  const count = await getDealActionCount(userId, role);
  if (count === 0) return null;
  const u = uiText(dealLocale(await getLocale()));
  return (
    <Link href={`${DEALS_HREF}?filter=mine`} className="flex min-h-14 items-center gap-3 rounded bg-ink px-4 py-3 text-paper transition hover:bg-graphite">
      <IoBriefcase className="h-5 w-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 font-medium">{count === 1 ? u("home.dealsWaiting.one") : u("home.dealsWaiting.many", { count })}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm text-paper/80">
        {u("home.dealsWaiting.open")}
        <IoArrowForward className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
