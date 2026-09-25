// Helpers for living with the iOS on-screen keyboard (see ChatViewport).

export function isTextField(el: Element | null): boolean {
  return !!el?.matches("input, textarea, [contenteditable='true']");
}

// Undoes the page scroll iOS adds to bring a focused field above the
// keyboard. Dashboard pages never scroll at the page level (their <main>
// does, see .dashboard-shell), so any page scroll there is iOS's. Jumps
// rather than glides: <html> has scroll-behavior: smooth, which is
// switched off for the call instead of passing behavior: "instant" —
// older Safari rejects that value outright.
export function resetPageScroll() {
  if (window.scrollY === 0) return;
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previous;
}
