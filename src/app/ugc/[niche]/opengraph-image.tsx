import { notFound } from "next/navigation";
import { ogNiche } from "@/lib/og-images";
import { getUgcNichePage, UGC_NICHE_PAGES } from "@/lib/seo-pages";

export const alt = "comtor – UGC-Creator finden";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Only the niches listed in seo-pages.ts exist; anything else is a plain 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return UGC_NICHE_PAGES.map((page) => ({ niche: page.slug }));
}

export default async function Image({ params }: { params: Promise<{ niche: string }> }) {
  const page = getUgcNichePage((await params).niche);
  if (!page) notFound();
  return ogNiche(page.ogLines, page.niche);
}
