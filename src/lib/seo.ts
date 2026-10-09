import type { Metadata } from "next";

// For pages that should never show up in search: token links (password
// reset, email verification), the signed-in app, onboarding. robots.txt
// only stops crawling; a URL linked from elsewhere can still be indexed
// without this.
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };

// The one URL search engines should file a public page under, so variants
// with query strings (?v=2, tracking parameters) don't count as duplicates.
// Relative; resolved against metadataBase (the site's own domain).
export function canonical(path: string): Metadata["alternates"] {
  return { canonical: path };
}
