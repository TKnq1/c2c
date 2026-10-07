"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLandingRole } from "@/components/landing/landing-role";
import { readUtm, utmQuery } from "@/lib/utm";

// A link to sign-up that carries the side of the page the visitor is looking
// at (Creators or Brands), so it's already chosen there instead of the form
// guessing. Creators until a side is picked, as the toggle itself shows.
// It also carries the campaign the landing page was opened with (utm_*), so a sign-up can be traced back to the
// advert it came from. Only in the link: no cookie, nothing stored on the device.
export function SignupLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const side = useLandingRole() ?? "creator";
  const campaign = utmQuery(readUtm(useSearchParams()));
  return (
    <Link href={`/onboarding?role=${side}${campaign ? `&${campaign}` : ""}`} className={className}>
      {children}
    </Link>
  );
}
