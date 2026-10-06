import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { LANDING_ROLE_SCRIPT } from "@/components/landing/landing-role-script";
import { getLocale, getT } from "@/lib/i18n/server";
import { canonical } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// The crowd counts are read on each visit, so a new account shows up
// without waiting for the next deploy.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("landing.meta.title");
  const description = t("landing.meta.description");
  const german = (await getLocale()) === "de";
  return {
    title: { absolute: title },
    description,
    alternates: canonical("/"),
    openGraph: { title, description, siteName: "comtor", type: "website", locale: german ? "de_DE" : "en_US" },
    // A page's twitter block replaces the layout's whole one, so the card type has to be repeated here: without it
    // X shows the 1200x630 image as a small square thumbnail.
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Home() {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }} />
      {/* Before any of the page paints: which side to show (see
          landing-role-script.ts). */}
      <script dangerouslySetInnerHTML={{ __html: LANDING_ROLE_SCRIPT }} />
      <LandingPage />
    </>
  );
}
