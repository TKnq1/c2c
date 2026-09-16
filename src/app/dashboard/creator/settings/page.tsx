import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditProfileForm } from "@/components/edit-profile-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { TwoFactorSettings } from "@/components/two-factor-settings";
import { LoginActivity } from "@/components/login-activity";
import { LogoutButton } from "@/components/logout-button";
import { PushNotificationsSettings } from "@/components/push-notifications-settings";
import { NotificationPreferences } from "@/components/notification-preferences";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { SettingsNav } from "@/components/settings-nav";
import { ConnectStripeButton } from "@/components/connect-stripe-button";

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
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-normal">Settings</h1>
      <SettingsNav role="CREATOR" />

      <div id="profile" className="scroll-mt-16">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <EditProfileForm
          displayName={creator.displayName}
          avatarUrl={creator.avatarUrl}
          niche={creator.niche}
          contentLanguage={creator.contentLanguage}
          bio={creator.bio}
          // The picker re-serializes this prop verbatim into the form's
          // hidden "platforms" field on every save, including untouched
          // entries — passing the raw Prisma rows through leaks id/creatorId
          // and, worse, a null url (Prisma's empty state) where the update
          // schema's url field only accepts a real string or undefined, so
          // saving with any URL-less platform (the common case, url is
          // optional) failed validation and silently dropped the whole
          // save, niche included.
          platforms={creator.platforms.map((p) => ({
            platform: p.platform,
            followerCount: p.followerCount,
            url: p.url ?? undefined,
          }))}
        />
      </div>

      <div id="payouts" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-lg font-semibold mb-2">Payouts</h2>
        <p className="text-sm text-neutral-600 mb-3 dark:text-neutral-400">
          {creator.stripeOnboarded
            ? "Connected — released payments go to your linked account."
            : "Connect a Stripe account before a brand's payment can be released to you."}
        </p>
        <ConnectStripeButton isOnboarded={creator.stripeOnboarded} />
      </div>

      <div id="password" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-lg font-semibold mb-4">Password</h2>
        <ChangePasswordForm />
      </div>

      <div id="two-factor" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-lg font-semibold mb-2">Two-factor authentication</h2>
        <TwoFactorSettings initialEnabled={user.totpEnabled} />
      </div>

      <div id="logins" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-lg font-semibold mb-2">Recent logins</h2>
        <LoginActivity userId={session.user.id} />
      </div>

      <div id="push" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-lg font-semibold mb-2">Notifications</h2>
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
      </div>

      <div id="data" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-lg font-semibold mb-2">Your data</h2>
        <a
          href="/api/account/export"
          className="text-sm text-neutral-600 underline hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Export my data (JSON)
        </a>
      </div>

      <div id="danger" className="border-t border-ink/10 pt-6 scroll-mt-16">
        <h2 className="text-lg font-semibold mb-2 text-ink">Danger zone</h2>
        <DeleteAccountForm />
      </div>

      <div className="border-t border-ink/10 pt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
