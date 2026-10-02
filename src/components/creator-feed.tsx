"use client";

import { SwipeCardStack } from "@/components/swipe-card-stack";
import type { SwipeRequest } from "@/components/swipe-card";
import type { FeedScope } from "@/lib/feed-scope";

// What's left to swipe once For you runs out: the All tab is the way on. All
// itself has nothing wider to point to, so it keeps the stack's default.
const FOR_YOU_CAUGHT_UP = {
  description: "No more new requests in your niches right now. Everything that fits your reach is under All.",
  action: { label: "Show all requests", href: "/dashboard/creator?feed=all" },
};

export function CreatorFeed({ requests, scope }: { requests: SwipeRequest[]; scope: FeedScope }) {
  return (
    // key resets the stack's local state if the underlying set changes
    // under it (e.g. a revalidated fetch bringing in a new request, or the
    // other tab).
    <SwipeCardStack
      key={`${scope}:${requests.map((r) => r.id).join(",")}`}
      requests={requests}
      caughtUp={scope === "forYou" ? FOR_YOU_CAUGHT_UP : undefined}
    />
  );
}
