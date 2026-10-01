"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { RatingSummary } from "@/components/stars";
import { RequestFacts } from "@/components/request-card-face";
import type { SwipeRequest } from "@/components/swipe-card";

// Desktop Feed: the details of the card on top of the stack, always open
// next to it (on phones the same content is a sheet behind a tap, see
// SwipeCard). Keyed by the request in the parent, so each new card starts
// scrolled to the top.
export function RequestDetailsPanel({ request }: { request: SwipeRequest }) {
  return (
    <article className="flex max-h-[min(600px,70dvh)] min-w-0 flex-col gap-5 overflow-y-auto">
      <Link
        href={`/dashboard/creator/discover/${request.startupId}`}
        className="flex items-center gap-3 self-start rounded transition hover:opacity-80"
      >
        <Avatar src={request.companyAvatarUrl} name={request.companyName} size={44} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{request.companyName}</span>
          <RatingSummary average={request.rating.average} count={request.rating.count} />
        </span>
      </Link>

      <h2 className="font-display text-title-2 font-bold text-balance">{request.title}</h2>

      <RequestFacts request={request} />

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {request.description}
      </p>
    </article>
  );
}
