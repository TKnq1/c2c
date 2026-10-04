"use client";

import { SwipeCardStack } from "@/components/swipe-card-stack";
import type { SwipeRequest } from "@/components/swipe-card";
import type { FeedScope } from "@/lib/feed-scope";
import { useI18n } from "@/components/i18n-provider";

export function CreatorFeed({ requests, scope }: { requests: SwipeRequest[]; scope: FeedScope }) {
  const { t } = useI18n();
  const caughtUp =
    scope === "forYou"
      ? { description: t("screens.feed.caughtUp"), action: { label: t("screens.feed.showAll"), href: "/dashboard/creator?feed=all" } }
      : undefined;
  return (
    // key resets the stack's local state if the underlying set changes
    // under it (e.g. a revalidated fetch bringing in a new request, or the
    // other tab).
    <SwipeCardStack
      key={`${scope}:${requests.map((r) => r.id).join(",")}`}
      requests={requests}
      caughtUp={caughtUp}
    />
  );
}
