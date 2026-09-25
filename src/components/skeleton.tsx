// The default rounding only applies when the caller doesn't pass its own —
// with both classes present, rounded-md wins over e.g. rounded-full purely
// by stylesheet order, which had every "circle" skeleton rendering square.
export function Skeleton({ className = "" }: { className?: string }) {
  const rounding = /(^|\s)rounded/.test(className) ? "" : "rounded-md";
  return <div className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 ${rounding} ${className}`} />;
}

// A row shaped like the common "card with avatar + two text lines" pattern
// used across Requests/Feed/Discover/Payments/Favorites.
export function SkeletonCardRow() {
  return (
    <div className="rounded-[20px] border border-ink/10 p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// The summary card both Payments pages open with (see PaymentStats): two
// money figures, then the row of three counts.
export function SkeletonPaymentStats() {
  return (
    <div className="rounded-[20px] border border-ink/10 p-4">
      <div className="grid grid-cols-2 divide-x divide-ink/10">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-2 px-4 first:pl-0 last:pr-0">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-ink/10 pt-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-6" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCardList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCardRow key={i} />
      ))}
    </div>
  );
}
