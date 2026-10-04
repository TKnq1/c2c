// Shared by the onboarding wizards, their server actions and the admin
// funnel. No "use client" / "use server" so all of them can import it.

export const CREATOR_STEPS = [
  { key: "name", label: "Your name" },
  { key: "niches", label: "Niches" },
  { key: "platforms", label: "Reach" },
  { key: "photo", label: "Photo" },
  { key: "matches", label: "Your matches" },
  { key: "swipe", label: "How it works" },
  { key: "payouts", label: "Payouts" },
  { key: "alerts", label: "Notifications" },
  { key: "done", label: "All set" },
] as const;

export const BRAND_STEPS = [
  { key: "company", label: "Your company" },
  { key: "niche", label: "Niche" },
  { key: "logo", label: "Logo" },
  { key: "creators", label: "Your creators" },
  { key: "alerts", label: "Notifications" },
  { key: "done", label: "All set" },
] as const;

export const ONBOARDING_EVENT_KINDS = ["viewed", "completed", "skipped"] as const;
export type OnboardingEventKind = (typeof ONBOARDING_EVENT_KINDS)[number];

export type OnboardingStepKey = (typeof CREATOR_STEPS)[number]["key"] | (typeof BRAND_STEPS)[number]["key"];

export function onboardingStepKeys(role: "CREATOR" | "STARTUP"): string[] {
  return (role === "CREATOR" ? CREATOR_STEPS : BRAND_STEPS).map((s) => s.key);
}

// What a step tells the person right after it is saved: a real number from
// the database, shown at the top of the next step.
export type OnboardingInsight =
  | { kind: "nicheRequests"; niches: string[]; requests: number; brands: number }
  | { kind: "reachRequests"; requests: number }
  | { kind: "brandNicheCreators"; niche: string; creators: number };

export function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return count === 1 ? one : many;
}

// `count` is shown big and counted up; `text` follows it (or stands alone
// when there is no number worth showing). Zero results say so plainly and
// say what happens next, rather than showing a "0".
export function insightMessage(insight: OnboardingInsight): { count: number | null; text: string } {
  switch (insight.kind) {
    case "nicheRequests": {
      const where = formatList(insight.niches);
      if (insight.requests === 0) {
        return { count: null, text: `No open requests in ${where} yet. New ones land in your feed as soon as brands post them.` };
      }
      return {
        count: insight.requests,
        text: `open ${plural(insight.requests, "request")} in ${where} from ${insight.brands} ${plural(insight.brands, "brand")}.`,
      };
    }
    case "reachRequests":
      if (insight.requests === 0) {
        return { count: null, text: "Nothing fits your reach just yet. New requests land in your feed as brands post them." };
      }
      return { count: insight.requests, text: `open ${plural(insight.requests, "request")} fit your reach right now.` };
    case "brandNicheCreators":
      if (insight.creators === 0) {
        return {
          count: null,
          text: `You're early: no ${insight.niche} creators are here yet. The ones who match your request are notified the moment you post it.`,
        };
      }
      return {
        count: insight.creators,
        text: `${insight.niche} ${plural(insight.creators, "creator is", "creators are")} on comtor.`,
      };
  }
}

export type FunnelRow = {
  key: string;
  label: string;
  viewed: number;
  completed: number;
  skipped: number;
  // Looked at the step and neither finished nor skipped it (yet).
  droppedOut: number;
};

// One row per step for the admin funnel, from the counted onboarding events.
// "done" is the last screen, so it is only ever viewed.
export function buildFunnel(
  role: "CREATOR" | "STARTUP",
  groups: { step: string; kind: string; count: number }[],
): FunnelRow[] {
  const count = (step: string, kind: OnboardingEventKind) =>
    groups.find((g) => g.step === step && g.kind === kind)?.count ?? 0;
  return (role === "CREATOR" ? CREATOR_STEPS : BRAND_STEPS).map(({ key, label }) => {
    const viewed = count(key, "viewed");
    const completed = count(key, "completed");
    const skipped = count(key, "skipped");
    return {
      key,
      label,
      viewed,
      completed,
      skipped,
      droppedOut: key === "done" ? 0 : Math.max(0, viewed - completed - skipped),
    };
  });
}
