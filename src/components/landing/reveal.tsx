"use client";

import { useEffect, useRef } from "react";

// Marks itself .is-in once it scrolls into view, which plays the entrance
// set up in landing.css (.lp-reveal and the .lp-rise-in / .lp-pop inside).
// Only ever once. A class rather than state, so nothing re-renders.
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-in");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`lp-reveal ${className}`} style={{ "--lp-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}
