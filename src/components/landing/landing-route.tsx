import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { BRAND_LANDING_PATH, LANDING_ROLE_SCRIPT } from "@/components/landing/landing-role-script";
import { getLocale, getT } from "@/lib/i18n/server";
import { canonical } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// The two addresses of the landing page: "/" for creators, /marken for brands. Same page, its own title,
// description and canonical each, so a search for creator work and one for creators to hire find their side.
export async function landingMetadata(pageRole: "creator" | "brand"): Promise<Metadata> {
  const t = await getT();
  const brand = pageRole === "brand";
  const title = brand ? t("landing.meta.brandTitle") : t("landing.meta.title");
  const description = brand ? t("landing.meta.brandDescription") : t("landing.meta.description");
  const german = (await getLocale()) === "de";
  return {
    title: { absolute: title },
    description,
    alternates: canonical(brand ? BRAND_LANDING_PATH : "/"),
    openGraph: { title, description, siteName: "comtor", type: "website", locale: german ? "de_DE" : "en_US" },
    // A page's twitter block replaces the layout's whole one, so the card type has to be repeated here: without it
    // X shows the 1200x630 image as a small square thumbnail.
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function LandingRoute({ pageRole }: { pageRole: "creator" | "brand" }) {
  const t = await getT();
  const german = (await getLocale()) === "de";
  // Tells search engines what the site is and in which language: the name, the address, the description.
  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "comtor",
    url: SITE_URL,
    inLanguage: german ? "de-DE" : "en",
    description: t("landing.meta.siteDescription"),
  };
  return (
    <>
      {pageRole === "creator" && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }} />}
      {/* Before any of the page paints: which side to show (see
          landing-role-script.ts). */}
      <script dangerouslySetInnerHTML={{ __html: LANDING_ROLE_SCRIPT }} />
      <LandingPage pageRole={pageRole === "brand" ? "brand" : null} />
    </>
  );
}
