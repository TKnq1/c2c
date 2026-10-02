import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete } from "@/lib/onboarding";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { BrandOnboarding } from "@/components/brand-onboarding";
import { CreatorOnboarding } from "@/components/creator-onboarding";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Set up your profile", robots: NO_INDEX };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  // Already finished (or came from before this flow existed) — nothing to
  // do here, and resubmitting a step would just overwrite real data.
  const [complete, user] = await Promise.all([
    isOnboardingComplete(session.user.id, session.user.role),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } }),
  ]);
  if (complete) redirect(session.user.role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator");
  const emailVerified = !!user?.emailVerified;

  return (
    <div className="flex flex-1 flex-col">
      {/* A way out for someone who signed up with the wrong email or role. */}
      <header className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
        <Logo />
        <LogoutButton className="text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400" />
      </header>
      {/* Top-aligned rather than centered, so the heading stays put as
          steps of different heights come and go. */}
      <main className="flex flex-1 justify-center px-6 pt-[6vh] pb-16">
        <div className="w-full max-w-md">
          {session.user.role === "STARTUP" ? (
            <BrandOnboarding emailVerified={emailVerified} />
          ) : (
            <CreatorOnboarding emailVerified={emailVerified} />
          )}
        </div>
      </main>
    </div>
  );
}
