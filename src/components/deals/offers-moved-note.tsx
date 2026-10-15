import Link from "next/link";
import { IoArrowForward } from "react-icons/io5";
import type { UiText } from "@/lib/deals/ui-copy";
import { DEALS_HREF } from "@/lib/nav-links";

// On the Payments page where the Deals screens are open: offers (and a brand's interested creators) moved to the Deals list.
// One line instead of the old sections, so a link from an older notification still finds them.
export function OffersMovedNote({ count, brand, anchor = "offers", u }: { count: number; brand: boolean; anchor?: "offers" | "interested"; u: UiText }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded bg-fog px-4 py-3 no-print">
      <p className="min-w-0 text-sm text-neutral-700 dark:text-neutral-300">{u(brand ? "deals.offersMoved" : "deals.offersMovedCreator")}</p>
      <Link href={`${DEALS_HREF}#${anchor}`} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium underline">
        {u("deals.offersMovedAction", { count })}
        <IoArrowForward className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
