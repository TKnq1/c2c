import Link from "next/link";
import { DEAL_FILTERS, type DealFilter } from "@/lib/deals/list-filter";
import { DEALS_HREF } from "@/lib/nav-links";
import type { UiText } from "@/lib/deals/ui-copy";

// The chips above the list of deals: all, waiting for me, active, finished, each with how many it shows. A link each, so the
// choice is in the address (?filter=mine) and a badge or a notice can land on it.
export function DealsFilter({ current, counts, u }: { current: DealFilter | null; counts: Record<"all" | DealFilter, number>; u: UiText }) {
  const chips: { id: "all" | DealFilter; href: string }[] = [
    { id: "all", href: DEALS_HREF },
    ...DEAL_FILTERS.map((id) => ({ id, href: `${DEALS_HREF}?filter=${id}` })),
  ];
  // "Waiting for me" first among the filters: it is the one that matters on a phone.
  const order: ("all" | DealFilter)[] = ["all", "mine", "active", "done"];
  chips.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return (
    <nav aria-label={u("deals.filters")} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = (current ?? "all") === chip.id;
        return (
          <Link
            key={chip.id}
            href={chip.href}
            prefetch={false}
            aria-current={active ? "true" : undefined}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              active ? "bg-ink text-paper" : "border border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
            }`}
          >
            {u(`deals.filter.${chip.id}`)}
            <span className={`tabular-nums ${active ? "text-paper/70" : "text-neutral-500 dark:text-neutral-400"}`}>{counts[chip.id]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
