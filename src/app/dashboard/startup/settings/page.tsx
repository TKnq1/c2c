import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NICHES } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";
import { EditBrandProfileForm } from "@/components/edit-brand-profile-form";
import { CopyProfileLink } from "@/components/copy-profile-link";
import { ChangePasswordForm } from "@/components/change-password-form";
import { TwoFactorSettings } from "@/components/two-factor-settings";
import { LoginActivity } from "@/components/login-activity";
import { LogoutButton } from "@/components/logout-button";
import { PushNotificationsSettings } from "@/components/push-notifications-settings";
import { NotificationPreferences } from "@/components/notification-preferences";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { SettingsNav } from "@/components/settings-nav";
import { ProPlanCard } from "@/components/pro-plan-card";
import { LegalLinks } from "@/components/legal-links";
import { AppearanceSettings } from "@/components/appearance-settings";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

export default async function StartupSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const [startup, user, requestCount] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      include: { socialLinks: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        totpEnabled: true,
        notifyNewRequests: true,
        notifyNewInterest: true,
        notifyMessages: true,
        notifyPayments: true,
        notifyDeposits: true,
        notifyNewCreators: true,
      },
    }),
    prisma.request.count({ where: { startup: { userId: session.user.id } } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-title-1 font-bold">Settings</h1>
      <SettingsNav role="STARTUP" />

      <OnboardingChecklist
        items={[
          { label: "Add your logo", done: !!startup.avatarUrl, href: "#profile" },
          { label: "Tell creators about your brand", done: !!startup.description, href: "#profile" },
          { label: "Post your first request", done: requestCount > 0, href: "/dashboard/startup/new" },
        ]}
      />

      <div id="profile" className="scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-4">Profile</h2>
        <EditBrandProfileForm
          companyName={startup.companyName}
          avatarUrl={startup.avatarUrl}
          website={startup.website ?? ""}
          niche={startup.niche ?? NICHES[0]}
          description={startup.description ?? ""}
          lookingFor={startup.lookingFor ?? ""}
          // See the equivalent map in the creator settings page — same
          // "don't leak raw Prisma rows into a re-serialized form field"
          // fix, kept here too even though StartupSocialLink.url is
          // non-nullable today so it can't hit the same validation failure.
          socialLinks={startup.socialLinks.map((s) => ({ platform: s.platform, url: s.url }))}
        />
        <div className="mt-4">
          <CopyProfileLink url={`${SITE_URL}/dashboard/creator/discover/${startup.id}`} />
        </div>
      </div>

      <div id="appearance" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-4">Appearance</h2>
        <AppearanceSettings />
      </div>

      <div id="plan" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-4">Plan</h2>
        <ProPlanCard key={String(startup.isPro)} isPro={startup.isPro} proSince={startup.proSince} />
      </div>

      <div id="password" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-4">Password</h2>
        <ChangePasswordForm />
      </div>

      <div id="two-factor" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-2">Two-factor authentication</h2>
        <TwoFactorSettings initialEnabled={user.totpEnabled} />
      </div>

      <div id="logins" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-2">Recent logins</h2>
        <LoginActivity userId={session.user.id} />
      </div>

      <div id="push" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-2">Notifications</h2>
        <PushNotificationsSettings />
        <NotificationPreferences
          role="STARTUP"
          preferences={{
            notifyNewRequests: user.notifyNewRequests,
            notifyNewInterest: user.notifyNewInterest,
            notifyMessages: user.notifyMessages,
            notifyPayments: user.notifyPayments,
            notifyDeposits: user.notifyDeposits,
            notifyNewCreators: user.notifyNewCreators,
          }}
        />
      </div>

      <div id="data" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-2">Your data</h2>
        <a
          href="/api/account/export"
          className="text-sm text-neutral-600 underline hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Export my data (JSON)
        </a>
      </div>

      <div id="danger" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-title-3 font-semibold mb-2 text-ink">Danger zone</h2>
        <DeleteAccountForm />
      </div>

      <LegalLinks />

      <div className="border-t border-ink/10 pt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
