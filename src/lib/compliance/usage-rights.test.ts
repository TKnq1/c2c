import { describe, expect, it } from "vitest";
import {
  isValidSparkAdsCode,
  usageState,
  usageWindow,
  validateUsageDelivery,
  validateUsageTerms,
  type UsageTerms,
} from "@/lib/compliance/usage-rights";

const paid: UsageTerms = {
  type: "PAID_ADS",
  channels: ["TIKTOK_SPARK_ADS", "META_PARTNERSHIP_ADS"],
  durationDays: 60,
  feeCents: 40_000,
  territory: "EU",
};

describe("validateUsageTerms", () => {
  it("accepts complete paid terms", () => {
    expect(validateUsageTerms(paid, { budgetMaxCents: 100_000 })).toEqual([]);
  });

  it("ignores usage details on organic-only posting, with a warning", () => {
    const issues = validateUsageTerms({ ...paid, type: "ORGANIC_ONLY" }, { budgetMaxCents: null });
    expect(issues.map((i) => `${i.severity}:${i.code}`)).toEqual(["warning:USAGE_FEE_UNEXPECTED"]);
    expect(validateUsageTerms({ type: "ORGANIC_ONLY", channels: [], durationDays: null, feeCents: null, territory: "EU" }, { budgetMaxCents: null })).toEqual([]);
  });

  it("does not take paid channels for cross-posting", () => {
    const cross: UsageTerms = { ...paid, type: "CROSS_POST", feeCents: null };
    expect(validateUsageTerms(cross, { budgetMaxCents: null }).map((i) => i.code)).toEqual(["USAGE_CHANNEL_NOT_ALLOWED", "USAGE_CHANNEL_NOT_ALLOWED"]);
  });
});

describe("isValidSparkAdsCode", () => {
  it("takes a long token, with or without the leading hash", () => {
    expect(isValidSparkAdsCode("#abcDEF0123456789xyzABC")).toBe(true);
    expect(isValidSparkAdsCode("abcDEF0123456789xyzABC==")).toBe(true);
    expect(isValidSparkAdsCode("short")).toBe(false);
    expect(isValidSparkAdsCode("has spaces in it 123456789012345")).toBe(false);
  });
});

describe("validateUsageDelivery", () => {
  const ends = new Date("2027-01-01T00:00:00Z");
  const none = { sparkAdsCode: null, sparkAdsCodeExpiresAt: null, permissionConfirmed: false };

  it("asks for the Spark code and for the partner-ad permission", () => {
    expect(validateUsageDelivery(paid, none, ends).map((i) => i.code)).toEqual(["SPARK_CODE_REQUIRED", "USAGE_PERMISSION_REQUIRED"]);
  });

  it("checks the code's format and that it outlives the usage period", () => {
    const code = "#abcDEF0123456789xyzABC";
    expect(validateUsageDelivery(paid, { ...none, sparkAdsCode: "nope", permissionConfirmed: true }, ends).map((i) => i.code)).toEqual(["SPARK_CODE_INVALID"]);
    expect(
      validateUsageDelivery(paid, { sparkAdsCode: code, sparkAdsCodeExpiresAt: new Date("2026-12-01T00:00:00Z"), permissionConfirmed: true }, ends).map((i) => i.code),
    ).toEqual(["SPARK_CODE_EXPIRES_TOO_EARLY"]);
    expect(validateUsageDelivery(paid, { sparkAdsCode: code, sparkAdsCodeExpiresAt: ends, permissionConfirmed: true }, ends)).toEqual([]);
  });

  it("asks for nothing when no paid usage was agreed", () => {
    expect(validateUsageDelivery({ ...paid, type: "CROSS_POST" }, none, ends)).toEqual([]);
  });
});

describe("usageState", () => {
  const start = new Date("2026-10-01T00:00:00Z");
  const window = usageWindow(start, 30);

  it("runs from the start for the agreed number of days", () => {
    expect(window.expiresAt.toISOString()).toBe("2026-10-31T00:00:00.000Z");
  });

  it("moves from active to expiring to expired", () => {
    expect(usageState({ type: "PAID_ADS" }, window, new Date("2026-10-10T00:00:00Z"))).toBe("ACTIVE");
    expect(usageState({ type: "PAID_ADS" }, window, new Date("2026-10-25T00:00:00Z"))).toBe("EXPIRING");
    expect(usageState({ type: "PAID_ADS" }, window, new Date("2026-10-31T00:00:00Z"))).toBe("EXPIRED");
  });

  it("is not applicable for organic posting and not started without a window", () => {
    expect(usageState({ type: "ORGANIC_ONLY" }, window, start)).toBe("NOT_APPLICABLE");
    expect(usageState({ type: "PAID_ADS" }, { startsAt: null, expiresAt: null }, start)).toBe("NOT_STARTED");
  });
});
