import { headers } from "next/headers";
import { LandingRoute, landingMetadata } from "@/components/landing/landing-route";
import { recordVisit } from "@/lib/visit-count";

// The landing page's brand side at its own address (see landing-route.tsx). Counted as a landing visit like "/".
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return landingMetadata("brand");
}

export default async function BrandLanding(props: PageProps<"/marken">) {
  recordVisit({ page: "landing", headers: await headers(), searchParams: await props.searchParams });
  return <LandingRoute pageRole="brand" />;
}
