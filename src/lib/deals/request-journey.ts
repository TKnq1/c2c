import type { NextStep } from "@/lib/deals/next-step";
import type { UiKey } from "@/lib/deals/ui-copy";

// The one line at the top of a brand's request that says where the campaign stands between "briefing written" and "deal running", so
// the briefing and the first deal are not two separate places with nothing in between. Once a deal runs, the line is that deal's
// "next step".

export type JourneyDeal = { id: string; terminal: boolean; mine: boolean; step: NextStep };

export type JourneyInput = {
  hasBriefing: boolean;
  // Creators who applied and have no offer yet; creators the brand wrote to and who have not answered.
  applicants: number;
  contacted: number;
  // Open offers, by who made them.
  offersFromBrand: number;
  offersFromCreators: number;
  deals: JourneyDeal[];
};

export type Journey = {
  key: UiKey;
  vars: Record<string, string | number>;
  // It is the brand's move: the line gets the accent dot.
  mine: boolean;
  // Only for the line about a deal: the label "Next step" in front of it, the deal to open and how many others run besides.
  deal: JourneyDeal | null;
  moreDeals: number;
  // The line links to the briefing.
  toBriefing: boolean;
};

const line = (key: UiKey, mine: boolean, vars: Journey["vars"] = {}, extra: Partial<Journey> = {}): Journey => ({
  key,
  vars,
  mine,
  deal: null,
  moreDeals: 0,
  toBriefing: false,
  ...extra,
});

// Running deals first (they are the work), then offers that wait for an answer, then the missing briefing, then who has applied or
// been written to. What is left is a request with nothing going on, or one whose deals are all finished.
export function requestJourney(input: JourneyInput): Journey {
  const active = input.deals.filter((d) => !d.terminal);
  if (active.length > 0) {
    const shown = active.find((d) => d.mine) ?? active[0];
    return line(shown.step.key, shown.step.mine, shown.step.vars, { deal: shown, moreDeals: active.length - 1 });
  }
  if (input.offersFromCreators > 0) {
    return line(input.offersFromCreators === 1 ? "journey.offerIn.one" : "journey.offerIn.many", true, { count: input.offersFromCreators });
  }
  if (input.offersFromBrand > 0) {
    return line(input.offersFromBrand === 1 ? "journey.offerOut.one" : "journey.offerOut.many", false, { count: input.offersFromBrand });
  }
  if (!input.hasBriefing) return line("journey.noBriefing", true, {}, { toBriefing: true });
  if (input.applicants > 0) {
    return line(input.applicants === 1 ? "journey.applicants.one" : "journey.applicants.many", true, { count: input.applicants });
  }
  if (input.contacted > 0) return line("journey.contacted", false);
  if (input.deals.length > 0) {
    return line(input.deals.length === 1 ? "journey.finished.one" : "journey.finished.many", false, { count: input.deals.length });
  }
  return line("journey.waiting", false);
}
