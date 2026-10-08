import { describe, expect, it } from "vitest";
import type { DealStatus } from "@prisma/client";
import { filterDeals, parseDealFilter } from "@/lib/deals/list-filter";

const deal = (status: DealStatus, brandSigned = true, creatorSigned = true) => ({
  status,
  brandSignedAt: brandSigned ? new Date() : null,
  creatorSignedAt: creatorSigned ? new Date() : null,
});

const deals = [
  deal("CONTRACT_PENDING", true, false), // waits for the creator
  deal("AWAITING_ESCROW"), // waits for the brand
  deal("IN_PRODUCTION"), // waits for the creator
  deal("DRAFT_SUBMITTED"), // waits for the brand
  deal("VERIFYING"), // waits for nobody
  deal("COMPLETED"),
  deal("CANCELLED"),
];

describe("parseDealFilter", () => {
  it("knows the three filters and nothing else", () => {
    expect(parseDealFilter("mine")).toBe("mine");
    expect(parseDealFilter("active")).toBe("active");
    expect(parseDealFilter("done")).toBe("done");
    expect(parseDealFilter("all")).toBeNull();
    expect(parseDealFilter("")).toBeNull();
    expect(parseDealFilter(undefined)).toBeNull();
    expect(parseDealFilter("MINE")).toBeNull();
  });

  it("takes the first of a repeated parameter", () => {
    expect(parseDealFilter(["done", "mine"])).toBe("done");
    expect(parseDealFilter(["bogus", "mine"])).toBeNull();
  });
});

describe("filterDeals", () => {
  const statuses = (list: { status: DealStatus }[]) => list.map((d) => d.status);

  it("shows everything without a filter", () => {
    expect(filterDeals(deals, null, "STARTUP")).toEqual(deals);
  });

  it("shows only the deals that wait for the person", () => {
    expect(statuses(filterDeals(deals, "mine", "STARTUP"))).toEqual(["AWAITING_ESCROW", "DRAFT_SUBMITTED"]);
    expect(statuses(filterDeals(deals, "mine", "CREATOR"))).toEqual(["CONTRACT_PENDING", "IN_PRODUCTION"]);
  });

  it("shows the running deals, and the finished ones", () => {
    expect(statuses(filterDeals(deals, "active", "CREATOR"))).toEqual(["CONTRACT_PENDING", "AWAITING_ESCROW", "IN_PRODUCTION", "DRAFT_SUBMITTED", "VERIFYING"]);
    expect(statuses(filterDeals(deals, "done", "CREATOR"))).toEqual(["COMPLETED", "CANCELLED"]);
  });
});
