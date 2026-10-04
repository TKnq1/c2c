import { describe, expect, it } from "vitest";
import { buildFunnel, formatList, insightMessage, onboardingStepKeys, plural } from "@/lib/onboarding-flow";

describe("formatList", () => {
  it("joins like a sentence", () => {
    expect(formatList([])).toBe("");
    expect(formatList(["Beauty"])).toBe("Beauty");
    expect(formatList(["Beauty", "Fitness"])).toBe("Beauty and Fitness");
    expect(formatList(["Beauty", "Fitness", "Food"])).toBe("Beauty, Fitness and Food");
  });
});

describe("plural", () => {
  it("only singularises one", () => {
    expect(plural(0, "request")).toBe("requests");
    expect(plural(1, "request")).toBe("request");
    expect(plural(2, "creator is", "creators are")).toBe("creators are");
  });
});

describe("insightMessage", () => {
  it("shows the number and what it counts", () => {
    expect(insightMessage({ kind: "nicheRequests", niches: ["Beauty", "Fitness"], requests: 4, brands: 2 })).toEqual({
      count: 4,
      text: "open requests in Beauty and Fitness from 2 brands.",
    });
    expect(insightMessage({ kind: "nicheRequests", niches: ["Beauty"], requests: 1, brands: 1 }).text).toBe(
      "open request in Beauty from 1 brand.",
    );
    expect(insightMessage({ kind: "reachRequests", requests: 3 })).toEqual({
      count: 3,
      text: "open requests fit your reach right now.",
    });
    expect(insightMessage({ kind: "brandNicheCreators", niche: "Food", creators: 1 })).toEqual({
      count: 1,
      text: "Food creator is on comtor.",
    });
    expect(insightMessage({ kind: "brandNicheCreators", niche: "Food", creators: 12 }).text).toBe(
      "Food creators are on comtor.",
    );
  });

  it("never shows a zero, and says what happens next", () => {
    const empty = [
      insightMessage({ kind: "nicheRequests", niches: ["Tech"], requests: 0, brands: 0 }),
      insightMessage({ kind: "reachRequests", requests: 0 }),
      insightMessage({ kind: "brandNicheCreators", niche: "Tech", creators: 0 }),
    ];
    for (const message of empty) {
      expect(message.count).toBeNull();
      expect(message.text.length).toBeGreaterThan(20);
    }
  });
});

describe("onboardingStepKeys", () => {
  it("lists the steps in order for each role", () => {
    expect(onboardingStepKeys("CREATOR").slice(0, 4)).toEqual(["name", "niches", "platforms", "photo"]);
    expect(onboardingStepKeys("STARTUP")[0]).toBe("company");
    expect(new Set(onboardingStepKeys("CREATOR")).size).toBe(onboardingStepKeys("CREATOR").length);
  });
});

describe("buildFunnel", () => {
  it("counts who dropped out of each step", () => {
    const rows = buildFunnel("CREATOR", [
      { step: "name", kind: "viewed", count: 10 },
      { step: "name", kind: "completed", count: 9 },
      { step: "niches", kind: "viewed", count: 9 },
      { step: "niches", kind: "completed", count: 6 },
      { step: "photo", kind: "viewed", count: 6 },
      { step: "photo", kind: "skipped", count: 4 },
      { step: "photo", kind: "completed", count: 1 },
      { step: "done", kind: "viewed", count: 5 },
    ]);
    expect(rows.map((r) => r.key)).toEqual(["name", "niches", "platforms", "photo", "matches", "swipe", "payouts", "alerts", "done"]);
    expect(rows.find((r) => r.key === "name")).toMatchObject({ viewed: 10, completed: 9, droppedOut: 1 });
    expect(rows.find((r) => r.key === "niches")?.droppedOut).toBe(3);
    expect(rows.find((r) => r.key === "photo")).toMatchObject({ skipped: 4, droppedOut: 1 });
    expect(rows.find((r) => r.key === "platforms")).toMatchObject({ viewed: 0, droppedOut: 0 });
    expect(rows.find((r) => r.key === "done")).toMatchObject({ viewed: 5, droppedOut: 0 });
  });

  it("uses the brand steps for brands", () => {
    expect(buildFunnel("STARTUP", []).map((r) => r.key)).toEqual(["company", "niche", "logo", "creators", "alerts", "done"]);
  });
});
