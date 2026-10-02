"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FeedScope } from "@/lib/feed-scope";

const TABS: { scope: FeedScope; label: string; href: string }[] = [
  { scope: "forYou", label: "For you", href: "/dashboard/creator" },
  { scope: "all", label: "All", href: "/dashboard/creator?feed=all" },
];

// For you (requests in the creator's niches) or All (everything their reach
// qualifies for). The choice is the page's ?feed= value, so the server only
// ever sends the cards of the one that's open. The tab switches right away
// and the cards follow once the page is in.
export function FeedScopeTabs({ scope }: { scope: FeedScope }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<FeedScope | null>(null);
  const shown = isPending && target ? target : scope;

  function select(next: (typeof TABS)[number]) {
    if (next.scope === shown) return;
    setTarget(next.scope);
    startTransition(() => router.replace(next.href, { scroll: false }));
  }

  return (
    <div role="tablist" aria-label="Feed" className="flex gap-1 self-center rounded bg-fog p-1">
      {TABS.map((tab) => (
        <button
          key={tab.scope}
          type="button"
          role="tab"
          aria-selected={shown === tab.scope}
          onClick={() => select(tab)}
          className={`rounded px-5 py-1.5 text-sm font-medium transition ${
            shown === tab.scope
              ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
              : "text-neutral-500 hover:text-ink dark:text-neutral-400"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
