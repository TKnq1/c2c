// A small activity ring for something in progress, in the colour of the
// text around it. Holds still for people who've asked for reduced motion
// (the half-drawn ring still reads as busy).
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`shrink-0 motion-safe:animate-spin ${className}`}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
