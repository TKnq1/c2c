export function Stars({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={className ?? "text-sm"} aria-hidden="true">
      <span className="text-neutral-900 dark:text-neutral-100">{"★".repeat(rounded)}</span>
      <span className="text-neutral-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export function RatingSummary({ average, count }: { average: number; count: number }) {
  if (count === 0) {
    return <span className="text-xs text-neutral-400 dark:text-neutral-500">No reviews yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
      <Stars rating={average} />
      {average.toFixed(1)} ({count})
    </span>
  );
}
