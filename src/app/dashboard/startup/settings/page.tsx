import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NICHES } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";
import { EditBrandProfileForm } from "@/components/edit-brand-profile-form";
import { CopyProfileLink } from "@/components/copy-profile-link";
import { ChangePasswordForm } from "@/components/change-password-form";
import { SignOutEverywhere } from "@/components/sign-out-everywhere";
import { TwoFactorSettings } from "@/components/two-factor-settings";
import { LoginActivity } from "@/components/login-activity";
import { LogoutButton } from "@/components/logout-button";
import { PushNotificationsSettings } from "@/components/push-notifications-settings";
import { NotificationPreferences } from "@/components/notification-preferences";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { SettingsNav } from "@/components/settings-nav";
import { SettingsRow, SettingsSection } from "@/components/settings-section";
import { ProPlanCard } from "@/components/pro-plan-card";
import { canWithdrawPro } from "@/lib/pro-withdrawal";
import { LegalLinks } from "@/components/legal-links";
import { AppearanceSettings } from "@/components/appearance-settings";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { canSellProSubscription } from "@/lib/native-app-server";
import { PageTitle } from "@/components/page-title";
import { getT } from "@/lib/i18n/server";

export default async function StartupSettingsPage() {
  const t = await getT();
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
      <PageTitle>{t("nav.settings")}</PageTitle>
      <SettingsNav role="STARTUP" />

      <OnboardingChecklist
        items={[
          { label: t("screens.settings.checkLogo"), done: !!startup.avatarUrl, href: "#profile" },
          { label: t("screens.settings.checkBrand"), done: !!startup.description, href: "#profile" },
          { label: t("screens.settings.checkRequest"), done: requestCount > 0, href: "/dashboard/startup/new" },
        ]}
      />

      <SettingsSection id="profile" title={t("screens.settings.profile")} description={t("screens.settings.profileBrand")}>
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

      <SettingsSection id="plan" title={t("screens.settings.plan")}>
        <ProPlanCard
          key={String(startup.isPro)}
          isPro={startup.isPro}
          proSince={startup.proSince}
          canWithdraw={startup.isPro && canWithdrawPro(startup.proSince)}
          canPurchase={await canSellProSubscription()}
        />
      </SettingsSection>

      <SettingsSection id="appearance" title={t("settings.appearance")}>
        <AppearanceSettings />
      </SettingsSection>

      <SettingsSection id="password" title={t("screens.settings.password")}>
        <ChangePasswordForm />
        <div className="mt-4 border-t border-ink/10 pt-4">
          <SignOutEverywhere />
        </div>
      </SettingsSection>

      <SettingsSection id="two-factor" title={t("screens.settings.twoFactor")}>
        <TwoFactorSettings initialEnabled={user.totpEnabled} />
      </SettingsSection>

      <SettingsSection id="logins" title={t("screens.settings.recentLogins")}>
        <LoginActivity userId={session.user.id} />
      </SettingsSection>

      <SettingsSection id="push" title={t("settingsNav.notifications")}>
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
        <SettingsSection id="admin" title={t("screens.settings.admin")}>
          <SettingsRow label={t("nav.admin")} hint={t("screens.settings.adminHint")}>
            <Link
              href="/admin"
              className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
            >
              {t("common.open")}
            </Link>
          </SettingsRow>
        </SettingsSection>
      )}

      <SettingsSection id="data" title={t("screens.settings.yourData")}>
        <SettingsRow label={t("screens.settings.exportData")} hint={t("screens.settings.exportHint")}>
          <a
            href="/api/account/export"
            className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
          >
            {t("common.export")}
          </a>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection id="danger" title={t("screens.settings.danger")}>
        <DeleteAccountForm />
      </SettingsSection>

      <LegalLinks />

      <LogoutButton className="w-full rounded-full border border-neutral-300 px-4 py-2.5 md:w-auto md:self-start md:px-6 text-sm font-medium text-neutral-700 transition hover:border-ink dark:border-neutral-700 dark:text-neutral-300" />
    </div>
  );
}
