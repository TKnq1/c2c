import Link from "next/link";
import type { Journey } from "@/lib/deals/request-journey";
import type { UiText } from "@/lib/deals/ui-copy";

// Where the campaign stands, in one line, with a dot in the accent colour when it is the brand's move. Once a deal runs, the line
// is that deal's next step and links to it.
export function RequestJourney({ journey, requestId, u }: { journey: Journey; requestId: string; u: UiText }) {
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded bg-fog px-4 py-3 text-sm" role="status">
      <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${journey.mine ? "bg-accent" : "bg-ink/25"}`} />
      <p className="min-w-0 flex-1 basis-56">
        {journey.deal && <span className="font-medium">{u("journey.next")}: </span>}
        {u(journey.key, journey.vars)}
        {journey.moreDeals > 0 && (
          <span className="text-neutral-500 dark:text-neutral-400">
            {" · "}
            {journey.moreDeals === 1 ? u("journey.moreDeals.one") : u("journey.moreDeals.many", { count: journey.moreDeals })}
          </span>
        )}
      </p>
      {journey.deal && (
        <Link href={`/dashboard/deals/${journey.deal.id}`} className="shrink-0 font-medium underline">
          {u("journey.toDeal")}
        </Link>
      )}
      {journey.toBriefing && (
        <Link href={`/dashboard/startup/requests/${requestId}/briefing`} className="shrink-0 font-medium underline">
          {u("journey.toBriefing")}
        </Link>
      )}
    </div>
  );
}
