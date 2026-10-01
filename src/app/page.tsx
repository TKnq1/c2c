import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { LANDING_ROLE_SCRIPT } from "@/components/landing/landing-role-script";

const TITLE = "comtor · Paid brand deals for creators";
const DESCRIPTION =
  "Creators swipe through brand deals with the budget upfront. The money's in before you post, and you keep 90%. Coming soon to iOS and Android.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
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
