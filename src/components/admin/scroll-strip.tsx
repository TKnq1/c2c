"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const EDGE = "28px";

// A row of links that scrolls sideways on a phone. It centers the link of the current page when the page changes, and fades the edge
// that still has more behind it, so a cut-off link reads as "scroll" and not as a broken layout.
export function ScrollStrip({ className = "", watch, children }: { className?: string; watch: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ before: false, after: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const before = el.scrollLeft > 4;
    const after = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setMore((prev) => (prev.before === before && prev.after === after ? prev : { before, after }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const current = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (current) el.scrollTo({ left: current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2 });
    // The observer reports once when it starts, which is the first measurement.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [watch, measure]);

  const mask =
    more.before && more.after
      ? `linear-gradient(to right, transparent, #000 ${EDGE}, #000 calc(100% - ${EDGE}), transparent)`
      : more.after
        ? `linear-gradient(to right, #000 calc(100% - ${EDGE}), transparent)`
        : more.before
          ? `linear-gradient(to left, #000 calc(100% - ${EDGE}), transparent)`
          : undefined;

  return (
    <div ref={ref} onScroll={measure} className={`relative ${className}`} style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}>
      {children}
    </div>
  );
}
