"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { parseFeedScope, type FeedScope } from "@/lib/feed-scope";
import type { MessageKey } from "@/lib/i18n/translate";

const TABS: { scope: FeedScope; label: MessageKey; href: string }[] = [
  { scope: "forYou", label: "feed.forYou", href: "/dashboard/creator" },
  { scope: "all", label: "feed.all", href: "/dashboard/creator?feed=all" },
];

// For you (requests in the creator's niches) or All (everything their reach
// qualifies for). The choice is the page's ?feed= value, so the server only
// ever sends the cards of the one that's open. The tab switches right away
// and the cards follow once the page is in.
// "page" sits under the heading on desktop. "header" is the phone navbar,
// where it takes the place of the "Feed" title.
export function FeedScopeTabs({ scope, variant = "page" }: { scope: FeedScope; variant?: "page" | "header" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<FeedScope | null>(null);
  const shown = isPending && target ? target : scope;

  function select(next: (typeof TABS)[number]) {
    if (next.scope === shown) return;
    setTarget(next.scope);
    startTransition(() => router.replace(next.href, { scroll: false }));
  }

  const { t } = useI18n();
  const header = variant === "header";

  return (
    <div
      role="tablist"
      aria-label={t("feed.label")}
      className={`relative grid w-max grid-cols-2 rounded bg-fog p-1 ${header ? "" : "self-center"}`}
    >
      {/* Same 4px corner as the rest of the app. It slides between the two
          labels instead of the fill popping from one to the other. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900"
        style={{ transform: shown === "all" ? "translateX(100%)" : "translateX(0)" }}
      />
      {TABS.map((tab) => (
        <button
          key={tab.scope}
          type="button"
          role="tab"
          aria-selected={shown === tab.scope}
          onClick={() => select(tab)}
          className={`relative z-10 font-medium transition-colors duration-300 motion-reduce:transition-none ${
            header ? "px-3 py-1 text-sm" : "px-5 py-1.5 text-sm"
          } ${
            shown === tab.scope
              ? "text-neutral-900 dark:text-neutral-100"
              : "text-neutral-500 hover:text-ink dark:text-neutral-400"
          }`}
        >
          {t(tab.label)}
        </button>
      ))}
    </div>
  );
}

// The phone header's copy. Reads ?feed= itself so the navbar, which sits
// above the page, doesn't need the scope handed down. Wrapped in Suspense
// where it's rendered (useSearchParams).
export function FeedHeaderToggle() {
  const searchParams = useSearchParams();
  return <FeedScopeTabs scope={parseFeedScope(searchParams.get("feed") ?? undefined)} variant="header" />;
}
