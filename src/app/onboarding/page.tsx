import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete } from "@/lib/onboarding";
import { LogoWatermark } from "@/components/logo-backdrop";
import { OnboardingExit } from "@/components/onboarding-exit";
import { BrandOnboarding } from "@/components/brand-onboarding";
import { CreatorOnboarding } from "@/components/creator-onboarding";
import { GuestOnboarding } from "@/components/guest-onboarding";
import type { Metadata } from "next";
import { metadataFor, NO_INDEX } from "@/lib/seo";
import { parseSignupRole } from "@/lib/signup-role";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor({ title: "Set up your profile", robots: NO_INDEX }, { title: "Profil einrichten", robots: NO_INDEX });

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const session = await auth();
  const searchParams = await props.searchParams;
  const requestedRole = parseSignupRole(searchParams.role);

  if (session?.user.role === "ADMIN") redirect("/admin");

  let body: ReactNode;
  if (session && (session.user.role === "STARTUP" || session.user.role === "CREATOR")) {
    // Already finished — resubmitting a step would overwrite real data.
    // Payouts and notifications are optional, so a complete profile leaves.
    const [complete, user] = await Promise.all([
      isOnboardingComplete(session.user.id, session.user.role),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true },
      }),
    ]);
    if (complete) redirect(session.user.role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator");
    const emailVerified = !!user?.emailVerified;
    body =
      session.user.role === "STARTUP" ? (
        <BrandOnboarding emailVerified={emailVerified} />
      ) : (
        <CreatorOnboarding emailVerified={emailVerified} />
      );
  } else if (session) {
    redirect("/dashboard");
  } else {
    body = <GuestOnboarding initialRole={requestedRole} />;
  }

  return (
    <div className="onboarding-stage logo-backdrop relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <LogoWatermark />
      <header className="relative z-10 flex shrink-0 items-center justify-end px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:pb-4">
        <OnboardingExit loggedIn={!!session} />
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:overflow-y-auto sm:px-6 sm:py-8">
        {body}
      </main>
    </div>
  );
}
