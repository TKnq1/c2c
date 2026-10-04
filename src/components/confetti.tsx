"use client";

import { useEffect, useState } from "react";

const COLORS = ["#070707", "#a3a3a3", "#fbbf24", "#f87171", "#60a5fa", "#34d399"];
const PIECES = 36;
const LIFETIME_MS = 4200;

type Piece = { left: number; drift: number; spin: number; delay: number; duration: number; size: number; color: string; round: boolean };

function makePieces(): Piece[] {
  return Array.from({ length: PIECES }, () => ({
    left: 10 + Math.random() * 80,
    drift: (Math.random() - 0.5) * 220,
    spin: (Math.random() - 0.5) * 900,
    delay: Math.random() * 350,
    duration: 2200 + Math.random() * 1400,
    size: 6 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    round: Math.random() > 0.6,
  }));
}

// A short burst of confetti over the screen, once, for the moment the
// onboarding pays off. Not rendered at all for anyone who prefers reduced
// motion. Only ever mounted in the browser after something has loaded (never
// in server HTML), so its random pieces can't differ between the two.
export function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>(() =>
    typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? [] : makePieces(),
  );

  useEffect(() => {
    const timer = setTimeout(() => setPieces([]), LIFETIME_MS);
    return () => clearTimeout(timer);
  }, []);

  if (pieces.length === 0) return null;
  return (
    <div aria-hidden="true" className="no-print pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 block"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              borderRadius: p.round ? "9999px" : 1,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
