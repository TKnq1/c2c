import { describe, expect, it } from "vitest";
import { aggregateCampaigns, aggregateChannels, rates, sourceChannel, type SignupRow, type SpendRow } from "@/lib/admin-ads";

const spend = (over: Partial<SpendRow>): SpendRow => ({
  day: new Date("2026-10-01T00:00:00Z"),
  channel: "meta",
  campaignKey: "herbst",
  campaignName: "Herbst",
  spendCents: 1000,
  impressions: 1000,
  clicks: 50,
  ...over,
});
const signup = (over: Partial<SignupRow>): SignupRow => ({ source: null, campaign: null, role: "STARTUP", activated: false, interests: [], ...over });

describe("sourceChannel", () => {
  it("maps utm sources onto the channels of the spend import", () => {
    expect(sourceChannel(null)).toBe("none");
    expect(sourceChannel("facebook")).toBe("meta");
    expect(sourceChannel("instagram")).toBe("instagram");
    expect(sourceChannel("tiktok")).toBe("tiktok");
    expect(sourceChannel("newsletter")).toBe("newsletter");
  });
});

describe("rates", () => {
  const base = { spendCents: 0, impressions: 0, clicks: 0, signups: 0, brands: 0, creators: 0, activated: 0, payers: 0, paidCollabs: 0, feeCents: 0 };

  it("gives null instead of dividing by zero", () => {
    expect(rates(base)).toEqual({ ctr: null, cpcCents: null, clickToSignup: null, cpaCents: null, costPerActivatedCents: null });
  });

  it("computes click-through, cost per click, conversion and cost per sign-up", () => {
    const r = rates({ ...base, spendCents: 2000, impressions: 1000, clicks: 50, signups: 5, activated: 2 });
    expect(r.ctr).toBeCloseTo(0.05);
    expect(r.cpcCents).toBe(40);
    expect(r.clickToSignup).toBeCloseTo(0.1);
    expect(r.cpaCents).toBe(400);
    expect(r.costPerActivatedCents).toBe(1000);
  });
});

describe("aggregateCampaigns", () => {
  it("joins spend and sign-ups by campaign key and counts shared collabs once", () => {
    const shared = { id: "i1", paid: true, feeCents: 500 };
    const rows = aggregateCampaigns(
      [spend({}), spend({ day: new Date("2026-10-02T00:00:00Z"), spendCents: 500, clicks: 25 })],
      [
        signup({ campaign: "herbst", activated: true, interests: [shared] }),
        signup({ campaign: "herbst", role: "CREATOR", activated: true, interests: [shared] }),
        signup({ campaign: "creatorlink" }),
        signup({}),
      ],
    );
    const herbst = rows.find((r) => r.key === "herbst")!;
    expect(herbst).toMatchObject({ spendCents: 1500, clicks: 75, signups: 2, brands: 1, creators: 1, activated: 2, payers: 2, paidCollabs: 1, feeCents: 500, cpaCents: 750 });
    // A campaign with sign-ups but no spend still appears; sign-ups without a campaign do not.
    expect(rows.find((r) => r.key === "creatorlink")).toMatchObject({ spendCents: 0, signups: 1, cpaCents: 0 });
    expect(rows).toHaveLength(2);
  });
});

describe("aggregateChannels", () => {
  it("counts a sign-up for the channel its campaign was bought on, whatever the utm_source says", () => {
    const rows = aggregateChannels([spend({ channel: "meta" })], [signup({ source: "instagram", campaign: "herbst" }), signup({ source: "instagram" })]);
    expect(rows.find((r) => r.channel === "meta")).toMatchObject({ spendCents: 1000, signups: 1 });
    expect(rows.find((r) => r.channel === "instagram")).toMatchObject({ signups: 1 });
  });

  it("keeps sign-ups without a source as their own row", () => {
    const rows = aggregateChannels([spend({})], [signup({ source: "facebook" }), signup({}), signup({})]);
    expect(rows.find((r) => r.channel === "meta")).toMatchObject({ spendCents: 1000, signups: 1 });
    expect(rows.find((r) => r.channel === "none")).toMatchObject({ spendCents: 0, signups: 2 });
  });
});
