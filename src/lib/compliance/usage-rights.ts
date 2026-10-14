import { errorIssue, warningIssue, type Issue } from "@/lib/deals/issues";

// Usage rights: what the brand may do with the post beyond the creator's own channel. Posting on the channel is the
// deal itself; anything else (repost on the brand's accounts, running it as an ad through the creator's handle) is a
// separate, paid, time-limited right with its own price line.

export type UsageType = "ORGANIC_ONLY" | "CROSS_POST" | "PAID_ADS";

export const USAGE_CHANNELS = {
  BRAND_ORGANIC_REPOST: { label: "Repost on the brand's own channels", type: "CROSS_POST" },
  BRAND_WEBSITE: { label: "Brand website / shop", type: "CROSS_POST" },
  META_PARTNERSHIP_ADS: { label: "Meta Partnership Ads (Instagram / Facebook)", type: "PAID_ADS" },
  TIKTOK_SPARK_ADS: { label: "TikTok Spark Ads", type: "PAID_ADS" },
  YOUTUBE_PARTNERSHIP_ADS: { label: "YouTube Partnership Ads", type: "PAID_ADS" },
  WHITELISTING: { label: "Whitelisting (ads through the creator's handle)", type: "PAID_ADS" },
} as const satisfies Record<string, { label: string; type: UsageType }>;

export type UsageChannel = keyof typeof USAGE_CHANNELS;
export const USAGE_CHANNEL_CODES = Object.keys(USAGE_CHANNELS) as UsageChannel[];

export function isUsageChannel(value: string): value is UsageChannel {
  return Object.prototype.hasOwnProperty.call(USAGE_CHANNELS, value);
}

export const USAGE_MAX_DAYS = 730;
// How long a TikTok authorisation code can be issued for.
export const SPARK_CODE_VALIDITY_DAYS = [7, 30, 60, 90, 180, 365] as const;
export const USAGE_EXPIRY_WARNING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type UsageTerms = {
  type: UsageType;
  channels: string[];
  durationDays: number | null;
  feeCents: number | null;
  territory: string;
};

export const ORGANIC_ONLY_USAGE: UsageTerms = { type: "ORGANIC_ONLY", channels: [], durationDays: null, feeCents: null, territory: "EU" };

export function requiresUsageDelivery(terms: UsageTerms): boolean {
  return terms.type === "PAID_ADS";
}

export function validateUsageTerms(terms: UsageTerms, ctx: { budgetMaxCents: number | null }): Issue[] {
  const issues: Issue[] = [];

  if (terms.type === "ORGANIC_ONLY") {
    if (terms.channels.length > 0 || terms.durationDays || terms.feeCents) {
      issues.push(warningIssue("USAGE_FEE_UNEXPECTED", "usageType"));
    }
    return issues;
  }

  const allowed = USAGE_CHANNEL_CODES.filter((c) => USAGE_CHANNELS[c].type === terms.type);
  if (terms.channels.length === 0) issues.push(errorIssue("USAGE_CHANNEL_REQUIRED", "usageChannels"));
  for (const channel of terms.channels) {
    if (!isUsageChannel(channel) || !allowed.includes(channel)) {
      issues.push(errorIssue("USAGE_CHANNEL_NOT_ALLOWED", "usageChannels", { channel }));
    }
  }

  if (!terms.durationDays || terms.durationDays < 1) {
    issues.push(errorIssue("USAGE_DURATION_REQUIRED", "usageDurationDays"));
  } else if (terms.durationDays > USAGE_MAX_DAYS) {
    issues.push(errorIssue("USAGE_DURATION_TOO_LONG", "usageDurationDays", { max: USAGE_MAX_DAYS }));
  }

  if (terms.type === "PAID_ADS") {
    if (!terms.feeCents || terms.feeCents <= 0) {
      issues.push(errorIssue("USAGE_FEE_REQUIRED", "usageFeeCents"));
    }
  }
  if (terms.feeCents && ctx.budgetMaxCents !== null && terms.feeCents > ctx.budgetMaxCents) {
    issues.push(errorIssue("USAGE_FEE_EXCEEDS_BUDGET", "usageFeeCents"));
  }
  return issues;
}

// TikTok shows the code as a string of letters, digits and a few symbols, usually starting with "#".
const SPARK_CODE = /^#?[A-Za-z0-9+/_=-]{16,200}$/;

export function isValidSparkAdsCode(code: string): boolean {
  return SPARK_CODE.test(code.trim());
}

export type UsageDelivery = {
  sparkAdsCode: string | null;
  sparkAdsCodeExpiresAt: Date | null;
  // The creator confirms the partner-ad / whitelisting permission is granted in Meta's or YouTube's tools.
  permissionConfirmed: boolean;
};

// What the creator hands over so the brand can really run the post as an ad, checked against the agreed channels and
// how long the right is supposed to last.
export function validateUsageDelivery(terms: UsageTerms, delivery: UsageDelivery, usageEndsAt: Date | null): Issue[] {
  const issues: Issue[] = [];
  if (!requiresUsageDelivery(terms)) return issues;

  if (terms.channels.includes("TIKTOK_SPARK_ADS")) {
    if (!delivery.sparkAdsCode) {
      issues.push(errorIssue("SPARK_CODE_REQUIRED", "sparkAdsCode"));
    } else if (!isValidSparkAdsCode(delivery.sparkAdsCode)) {
      issues.push(errorIssue("SPARK_CODE_INVALID", "sparkAdsCode"));
    } else if (delivery.sparkAdsCodeExpiresAt && usageEndsAt && delivery.sparkAdsCodeExpiresAt.getTime() < usageEndsAt.getTime()) {
      issues.push(errorIssue("SPARK_CODE_EXPIRES_TOO_EARLY", "sparkAdsCodeExpiresAt"));
    }
  }
  const needsPermission = terms.channels.some((c) => c === "META_PARTNERSHIP_ADS" || c === "WHITELISTING" || c === "YOUTUBE_PARTNERSHIP_ADS");
  if (needsPermission && !delivery.permissionConfirmed) {
    issues.push(errorIssue("USAGE_PERMISSION_REQUIRED", "permissionConfirmed"));
  }
  return issues;
}

export type UsageState = "NOT_APPLICABLE" | "NOT_STARTED" | "ACTIVE" | "EXPIRING" | "EXPIRED";

// The right starts when the post is verified live and lasts durationDays from there.
export function usageWindow(startsAt: Date, durationDays: number): { startsAt: Date; expiresAt: Date } {
  return { startsAt, expiresAt: new Date(startsAt.getTime() + durationDays * DAY_MS) };
}

export function usageState(
  terms: Pick<UsageTerms, "type">,
  window: { startsAt: Date | null; expiresAt: Date | null },
  now: Date,
): UsageState {
  if (terms.type === "ORGANIC_ONLY") return "NOT_APPLICABLE";
  if (!window.startsAt || !window.expiresAt) return "NOT_STARTED";
  if (now.getTime() >= window.expiresAt.getTime()) return "EXPIRED";
  if (window.expiresAt.getTime() - now.getTime() <= USAGE_EXPIRY_WARNING_DAYS * DAY_MS) return "EXPIRING";
  return "ACTIVE";
}
