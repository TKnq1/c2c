"use client";

import { useId, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locales";

// Circular flags for the app-language picker. One English, so the circle is
// the Union Jack; Portuguese is Portugal, matching the European list.
const FLAG: Record<Locale, ReactNode> = {
  en: (
    <>
      <rect width="32" height="32" fill="#012169" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.4" />
      <path d="M16 0 V32 M0 16 H32" stroke="#fff" strokeWidth="11" />
      <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="6" />
    </>
  ),
  de: (
    <>
      <rect width="32" height="10.67" fill="#000" />
      <rect y="10.67" width="32" height="10.66" fill="#DD0000" />
      <rect y="21.33" width="32" height="10.67" fill="#FFCE00" />
    </>
  ),
  fr: (
    <>
      <rect width="10.67" height="32" fill="#0055A4" />
      <rect x="10.67" width="10.66" height="32" fill="#fff" />
      <rect x="21.33" width="10.67" height="32" fill="#EF4135" />
    </>
  ),
  es: (
    <>
      <rect width="32" height="32" fill="#AA151B" />
      <rect y="8" width="32" height="16" fill="#F1BF00" />
    </>
  ),
  it: (
    <>
      <rect width="10.67" height="32" fill="#009246" />
      <rect x="10.67" width="10.66" height="32" fill="#fff" />
      <rect x="21.33" width="10.67" height="32" fill="#CE2B37" />
    </>
  ),
  pt: (
    <>
      <rect width="12.8" height="32" fill="#006600" />
      <rect x="12.8" width="19.2" height="32" fill="#FF0000" />
      <circle cx="12.8" cy="16" r="5.2" fill="#FFCC00" />
      <circle cx="12.8" cy="16" r="3.2" fill="#FF0000" />
      <circle cx="12.8" cy="16" r="1.6" fill="#fff" />
    </>
  ),
  nl: (
    <>
      <rect width="32" height="10.67" fill="#AE1C28" />
      <rect y="10.67" width="32" height="10.66" fill="#fff" />
      <rect y="21.33" width="32" height="10.67" fill="#21468B" />
    </>
  ),
  pl: (
    <>
      <rect width="32" height="16" fill="#fff" />
      <rect y="16" width="32" height="16" fill="#DC143C" />
    </>
  ),
};

// A round flag, so a white band (France, Italy, Poland) still has an edge
// on a white page. Decorative: the language name next to it is the label.
export function FlagCircle({
  locale,
  className = "",
  ring = "text-black/15 dark:text-white/25",
}: {
  locale: Locale;
  className?: string;
  /** Stroke color of the hairline ring. Replaces the default so a selected tile can lighten it. */
  ring?: string;
}) {
  const clipId = `flag-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" className={`h-6 w-6 shrink-0 ${ring} ${className}`} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{FLAG[locale]}</g>
      <circle cx="16" cy="16" r="15.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
