import Link from "next/link";
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
import { SettingsRow, SettingsSection } from "@/components/settings-section";
import { ProPlanCard } from "@/components/pro-plan-card";
import { LegalLinks } from "@/components/legal-links";
import { AppearanceSettings } from "@/components/appearance-settings";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { canSellProSubscription } from "@/lib/native-app-server";
import { PageTitle } from "@/components/page-title";

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
    // A centered reading-width column from md, like a document, instead of
    // fields stretched across the whole screen.
    <div className="flex flex-col gap-8 md:mx-auto md:w-full md:max-w-2xl">
      <PageTitle>Settings</PageTitle>
      <SettingsNav role="STARTUP" />

      <OnboardingChecklist
        items={[
          { label: "Add your logo", done: !!startup.avatarUrl, href: "#profile" },
          { label: "Tell creators about your brand", done: !!startup.description, href: "#profile" },
          { label: "Post your first request", done: requestCount > 0, href: "/dashboard/startup/new" },
        ]}
      />

      <SettingsSection id="profile" title="Profile" description="What creators see when they look at your brand.">
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
        <div className="mt-4 border-t border-ink/10 pt-4">
          <CopyProfileLink url={`${SITE_URL}/dashboard/creator/discover/${startup.id}`} />
        </div>
      </SettingsSection>

      <SettingsSection id="plan" title="Plan">
        <ProPlanCard
          key={String(startup.isPro)}
          isPro={startup.isPro}
          proSince={startup.proSince}
          canPurchase={await canSellProSubscription()}
        />
      </SettingsSection>

      <SettingsSection id="appearance" title="Appearance">
        <AppearanceSettings />
      </SettingsSection>

      <SettingsSection id="password" title="Password">
        <ChangePasswordForm />
      </SettingsSection>

      <SettingsSection id="two-factor" title="Two-factor authentication">
        <TwoFactorSettings initialEnabled={user.totpEnabled} />
      </SettingsSection>

      <SettingsSection id="logins" title="Recent logins">
        <LoginActivity userId={session.user.id} />
      </SettingsSection>

      <SettingsSection id="push" title="Notifications">
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

      </SettingsSection>

      {session.user.isAdmin && (
        <SettingsSection id="admin" title="Admin">
          <SettingsRow label="Admin dashboard" hint="Users, payments, reports and disputes across comtor.">
            <Link
              href="/admin"
              className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
            >
              Open
            </Link>
          </SettingsRow>
        </SettingsSection>
      )}

      <SettingsSection id="data" title="Your data">
        <SettingsRow label="Export my data" hint="Everything in your account, as a JSON file.">
          <a
            href="/api/account/export"
            className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
          >
            Export
          </a>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection id="danger" title="Danger zone">
        <DeleteAccountForm />
      </SettingsSection>

      <LegalLinks />

      <LogoutButton className="w-full rounded-full border border-neutral-300 px-4 py-2.5 md:w-auto md:self-start md:px-6 text-sm font-medium text-neutral-700 transition hover:border-ink dark:border-neutral-700 dark:text-neutral-300" />
    </div>
  );
}
