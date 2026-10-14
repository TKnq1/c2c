import { describe, expect, it } from "vitest";
import { requestJourney, type JourneyDeal, type JourneyInput } from "@/lib/deals/request-journey";

const base: JourneyInput = { hasBriefing: true, applicants: 0, contacted: 0, offersFromBrand: 0, offersFromCreators: 0, deals: [] };
const deal = (id: string, over: Partial<JourneyDeal> = {}): JourneyDeal => ({
  id,
  terminal: false,
  mine: false,
  step: { key: "next.production.brand", vars: { name: "Mia" }, mine: false },
  ...over,
});

describe("requestJourney", () => {
  it("says the briefing is set and nobody has answered yet", () => {
    expect(requestJourney(base)).toMatchObject({ key: "journey.waiting", mine: false, deal: null });
  });

  it("asks for the briefing when there is none, and links to it", () => {
    expect(requestJourney({ ...base, hasBriefing: false })).toMatchObject({ key: "journey.noBriefing", mine: true, toBriefing: true });
  });

  it("counts creators who wait for an offer, singular and plural", () => {
    expect(requestJourney({ ...base, applicants: 1 })).toMatchObject({ key: "journey.applicants.one", mine: true, vars: { count: 1 } });
    expect(requestJourney({ ...base, applicants: 3 })).toMatchObject({ key: "journey.applicants.many", vars: { count: 3 } });
  });

  it("is waiting for the creator once the brand has written to one", () => {
    expect(requestJourney({ ...base, contacted: 2 })).toMatchObject({ key: "journey.contacted", mine: false });
  });

  it("puts an offer from a creator before everything but a running deal", () => {
    expect(requestJourney({ ...base, applicants: 2, offersFromCreators: 1 })).toMatchObject({ key: "journey.offerIn.one", mine: true });
    expect(requestJourney({ ...base, offersFromBrand: 2 })).toMatchObject({ key: "journey.offerOut.many", mine: false, vars: { count: 2 } });
  });

  it("shows the next step of a running deal, whose move it is, and how many others run", () => {
    const waiting = deal("a");
    const mine = deal("b", { mine: true, step: { key: "next.draft.review", vars: { date: "1. Nov." }, mine: true } });
    const journey = requestJourney({ ...base, offersFromCreators: 1, deals: [waiting, mine, deal("c", { terminal: true })] });
    expect(journey).toMatchObject({ key: "next.draft.review", mine: true, moreDeals: 1, toBriefing: false });
    expect(journey.deal?.id).toBe("b");
  });

  it("falls back to the first running deal when none waits for the brand", () => {
    const journey = requestJourney({ ...base, deals: [deal("a"), deal("b")] });
    expect(journey.deal?.id).toBe("a");
    expect(journey.moreDeals).toBe(1);
  });

  it("says the deals are finished when that is all there is", () => {
    expect(requestJourney({ ...base, deals: [deal("a", { terminal: true })] })).toMatchObject({ key: "journey.finished.one" });
    expect(requestJourney({ ...base, deals: [deal("a", { terminal: true }), deal("b", { terminal: true })] })).toMatchObject({ key: "journey.finished.many", vars: { count: 2 } });
  });
});
