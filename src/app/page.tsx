import { headers } from "next/headers";
import { LandingRoute, landingMetadata } from "@/components/landing/landing-route";
import { recordVisit } from "@/lib/visit-count";

// Rendered on each visit (the language comes from a cookie); the crowd counts behind it are cached for five
// minutes (see landing-crowd.ts), so a new account shows up without waiting for the next deploy.
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return landingMetadata("creator");
}

export default async function Home(props: PageProps<"/">) {
  // Counted without a cookie or an address: one more visit of the landing page today, from where it came (see visit-count.ts).
  recordVisit({ page: "landing", headers: await headers(), searchParams: await props.searchParams });
  return <LandingRoute pageRole="creator" />;
}
