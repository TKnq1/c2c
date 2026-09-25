"use client";

import { useMemo } from "react";
import { SwipeCardStack } from "@/components/swipe-card-stack";

type RequestEntry = {
  id: string;
  startupId: string;
  isBrandFavorited: boolean;
  title: string;
  description: string;
  niche: string;
  languages: string[];
  minFollowers: number;
  productCategory: string;
  companyName: string;
  companyAvatarUrl: string | null;
  rating: { average: number; count: number };
  imageUrl: string | null;
  interestId: string | null;
  contactedByStartup: boolean;
};

export function CreatorFeed({ requests }: { requests: RequestEntry[] }) {
  // Already-decided requests (an interest exists, yours or the brand
  // reaching out first) live on the dedicated Matches page now — the swipe
  // stack here is only ever fresh, undecided ones.
  const undecided = useMemo(() => requests.filter((r) => r.interestId === null), [requests]);

  return (
    // key resets the stack's local state if the underlying set changes
    // under it (e.g. a revalidated fetch bringing in a new request).
    <SwipeCardStack key={undecided.map((r) => r.id).join(",")} requests={undecided} />
  );
}
