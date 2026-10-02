import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { EditProfileForm } from "@/components/edit-profile-form";
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
import { ConnectStripeButton } from "@/components/connect-stripe-button";
import { LegalLinks } from "@/components/legal-links";
import { AppearanceSettings } from "@/components/appearance-settings";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { PageTitle } from "@/components/page-title";

export default async function CreatorSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  const [creator, user] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      include: { platforms: true },
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
  ]);

  return (
    // A centered reading-width column from md, like a document, instead of
    // fields stretched across the whole screen.
    <div className="flex flex-col gap-8 md:mx-auto md:w-full md:max-w-2xl">
      <PageTitle>Settings</PageTitle>
      <SettingsNav role="CREATOR" />

      <OnboardingChecklist
        items={[
          { label: "Add your photo", done: !!creator.avatarUrl, href: "#profile" },
          { label: "Tell brands about yourself", done: !!creator.bio, href: "#profile" },
          { label: "Add a link to one of your platforms", done: creator.platforms.some((p) => p.url), href: "#profile" },
        ]}
      />

      <SettingsSection id="profile" title="Profile" description="What brands see when they look at your profile.">
        <EditProfileForm
          displayName={creator.displayName}
          avatarUrl={creator.avatarUrl}
          niches={creator.niches}
          contentLanguage={creator.contentLanguage}
          bio={creator.bio}
          // The picker re-serializes this prop verbatim into the form's
          // hidden "platforms" field on every save, including untouched
          // entries — passing the raw Prisma rows through leaks id/creatorId
          // and, worse, a null url (Prisma's empty state) where the update
          // schema's url field only accepts a real string or undefined, so
          // saving with any URL-less platform (the common case, url is
          // optional) failed validation and silently dropped the whole
          // save, niches included.
          platforms={creator.platforms.map((p) => ({
            platform: p.platform,
            followerCount: p.followerCount,
            url: p.url ?? undefined,
          }))}
        />
        <div className="mt-4 border-t border-ink/10 pt-4">
          <CopyProfileLink url={`${SITE_URL}/dashboard/startup/discover/${creator.id}`} />
        </div>
      </SettingsSection>

      <SettingsSection id="payouts" title="Payouts">
        <SettingsRow
          label={creator.stripeOnboarded ? "Connected" : creator.stripeAccountId ? "Setup not finished" : "Not connected"}
          hint={
            creator.stripeOnboarded
              ? "Released payments go to your bank account."
              : creator.stripeAccountId
                ? "Stripe hasn't confirmed your payout account yet."
                : "Connect Stripe so a brand's payment can reach your bank account."
          }
        />
        <div>
          <ConnectStripeButton
            isOnboarded={creator.stripeOnboarded}
            label={creator.stripeOnboarded ? undefined : creator.stripeAccountId ? "Continue setup" : "Connect Stripe"}
            embedClassName="mt-1"
          />
        </div>
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
          role="CREATOR"
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
