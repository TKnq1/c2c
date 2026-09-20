import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isOnboardingComplete } from "@/lib/onboarding";
import { Logo } from "@/components/logo";
import { BrandOnboarding } from "@/components/brand-onboarding";
import { CreatorOnboarding } from "@/components/creator-onboarding";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  // Already finished (or came from before this flow existed) — nothing to
  // do here, and resubmitting a step would just overwrite real data.
  const complete = await isOnboardingComplete(session.user.id, session.user.role);
  if (complete) redirect(session.user.role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator");

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-16">
      <Logo />
      {session.user.role === "STARTUP" ? <BrandOnboarding /> : <CreatorOnboarding />}
    </main>
  );
}
