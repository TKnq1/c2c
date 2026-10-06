import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { LANDING_ROLE_SCRIPT } from "@/components/landing/landing-role-script";
import { canonical } from "@/lib/seo";

const TITLE = "comtor · Paid brand deals for creators";
const DESCRIPTION =
  "Creators swipe through brand deals with the budget upfront. The money's in before you post, and you keep 90%. Live on the web now, coming soon to iOS and Android.";

// The crowd counts are read on each visit, so a new account shows up
// without waiting for the next deploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: canonical("/"),
  openGraph: { title: TITLE, description: DESCRIPTION },
  // A page's twitter block replaces the layout's whole one, so the card type has to be repeated here: without it
  // X shows the 1200x630 image as a small square thumbnail.
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function Home() {
  return (
    <>
      {/* Before any of the page paints: which side to show (see
          landing-role-script.ts). */}
      <script dangerouslySetInnerHTML={{ __html: LANDING_ROLE_SCRIPT }} />
      <LandingPage />
    </>
  );
}
