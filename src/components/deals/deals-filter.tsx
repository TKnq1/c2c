import { FilterChip, FilterChipRow } from "@/components/filters";
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
    <FilterChipRow label={u("deals.filters")}>
      {chips.map((chip) => (
        <FilterChip key={chip.id} href={chip.href} active={(current ?? "all") === chip.id} count={counts[chip.id]}>
          {u(`deals.filter.${chip.id}`)}
        </FilterChip>
      ))}
    </FilterChipRow>
  );
}
