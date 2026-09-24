export function Stars({ rating, className, light }: { rating: number; className?: string; light?: boolean }) {
  const rounded = Math.round(rating);
  return (
    <span className={className ?? "text-sm"} aria-hidden="true">
      <span className={light ? "text-white" : "text-neutral-900 dark:text-neutral-100"}>{"★".repeat(rounded)}</span>
      <span className={light ? "text-white/40" : "text-neutral-300"}>{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

// light: for overlaying on a photo (see SwipeCard) instead of the paper
// background everywhere else this is used — same idea as dark mode, but
// independent of the app theme since it's tied to what's under it, not the
// user's OS/app preference.
export function RatingSummary({ average, count, light }: { average: number; count: number; light?: boolean }) {
  if (count === 0) {
    return (
      <span className={light ? "text-xs text-white/70" : "text-xs text-neutral-400 dark:text-neutral-500"}>
        No reviews yet
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${light ? "text-white/90" : "text-neutral-600 dark:text-neutral-400"}`}>
      <Stars rating={average} light={light} />
      {average.toFixed(1)} ({count})
    </span>
  );
}
