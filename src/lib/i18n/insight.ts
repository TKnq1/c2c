import type { OnboardingInsight } from "@/lib/onboarding-flow";
import { localizedList, type MessageKey, type TFunction } from "@/lib/i18n/translate";

function word(t: TFunction, count: number, one: MessageKey, many: MessageKey) {
  return count === 1 ? t(one) : t(many);
}

// The banner's copy in the app language. insightMessage() in
// onboarding-flow.ts stays English — the admin funnel and its tests use it.
export function localizedInsight(insight: OnboardingInsight, t: TFunction): { count: number | null; text: string } {
  switch (insight.kind) {
    case "nicheRequests": {
      const where = localizedList(insight.niches, t("onboarding.insight.listAnd"));
      if (insight.requests === 0) return { count: null, text: t("onboarding.insight.nicheEmpty", { where }) };
      return {
        count: insight.requests,
        text: t("onboarding.insight.niche", {
          requests: word(t, insight.requests, "onboarding.insight.requestOne", "onboarding.insight.requestMany"),
          where,
          brands: insight.brands,
          brandsWord: word(t, insight.brands, "onboarding.insight.brandOne", "onboarding.insight.brandMany"),
        }),
      };
    }
    case "reachRequests":
      if (insight.requests === 0) return { count: null, text: t("onboarding.insight.reachEmpty") };
      return {
        count: insight.requests,
        text: t("onboarding.insight.reach", {
          requests: word(t, insight.requests, "onboarding.insight.requestOne", "onboarding.insight.requestMany"),
        }),
      };
    case "brandNicheCreators":
      if (insight.creators === 0) {
        return { count: null, text: t("onboarding.insight.creatorsEmpty", { niche: insight.niche }) };
      }
      return {
        count: insight.creators,
        text: t("onboarding.insight.creators", {
          niche: insight.niche,
          creatorsWord: word(t, insight.creators, "onboarding.insight.creatorIs", "onboarding.insight.creatorsAre"),
        }),
      };
  }
}
