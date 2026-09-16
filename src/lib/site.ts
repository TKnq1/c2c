// Prefer an explicit custom domain; otherwise fall back to the URL Vercel
// assigns automatically (VERCEL_URL, host only — no protocol) so metadata
// generation (metadataBase, robots.txt, sitemap.xml) is correct immediately
// after deploy with zero config. Falls back to localhost for local dev.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
