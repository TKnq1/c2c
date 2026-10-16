import "@/components/landing/landing.css";
import { ComingSoon } from "@/components/landing/coming-soon";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingPageRole, LandingRoleSync, type LandingRole } from "@/components/landing/landing-role";
import { landingCrowd } from "@/lib/landing-crowd";

// comtor.app for anyone not logged in (logged-in visitors are sent on to the
// dashboard by the proxy). Creators and brands each get their own half,
// switched in the nav; see landing.css for how only one shows. "/" stands for
// creators, /marken for brands (pageRole), each with its own h1 for search.
export async function LandingPage({ pageRole }: { pageRole: LandingRole | null }) {
  const crowd = await landingCrowd();
  return (
    <LandingPageRole role={pageRole}>
      <div className="flex-1 bg-paper" data-landing-default={pageRole ?? "creator"}>
        <LandingRoleSync role={pageRole} />
        <LandingNav />
        <main>
          <Hero brands={crowd.brands} creators={crowd.creators} primary={pageRole ?? "creator"} />
          <FeatureGrid />
          <LandingFaq />
          <ComingSoon />
        </main>
        <LandingFooter />
      </div>
    </LandingPageRole>
  );
}
