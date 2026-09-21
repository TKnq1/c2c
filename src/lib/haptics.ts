// Android/Chrome only (no iOS Safari support at all, desktop ignores it
// silently) — a no-op everywhere else, so it's always safe to just call.
export function vibrate(pattern: number | number[] = 10) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers throw if called outside a user gesture — never worth surfacing.
  }
}
