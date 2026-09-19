import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { UnreadTitleBadge } from "@/components/unread-title-badge";
import { WelcomeOverlay } from "@/components/welcome-overlay";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { getUnreadCount } from "@/lib/notifications";
import { getUnreadMessageCount } from "@/lib/messages";
import { getPendingPaymentActionCount } from "@/lib/payments";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // The pending-payments badge only ever renders on the creator nav item
  // (see Nav) — for a startup session, getPendingPaymentActionCount's own
  // creatorProfile lookup would always come back empty, so it's skipped
  // entirely rather than spending a Neon round-trip on every dashboard
  // page load just to compute a number nothing displays.
  const [unreadCount, unreadMessages, pendingPayments, user] = await Promise.all([
    getUnreadCount(session.user.id),
    getUnreadMessageCount(session.user.id, session.user.role),
    session.user.role === "CREATOR" ? getPendingPaymentActionCount(session.user.id) : Promise.resolve(0),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-lg focus:bg-neutral-900 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Suspense fallback={null}>
        <WelcomeOverlay />
      </Suspense>
      <UnreadTitleBadge count={unreadCount + unreadMessages} />
      <Nav
        role={session.user.role}
        unreadCount={unreadCount}
        unreadMessages={unreadMessages}
        pendingPayments={pendingPayments}
      />
      {!user?.emailVerified && <EmailVerificationBanner />}
      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
