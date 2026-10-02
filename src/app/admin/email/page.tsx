import { requireAdminSession } from "@/lib/admin-session";
import { emailSetup } from "@/lib/email";
import { SendTestEmailButton } from "@/components/admin/send-test-email-button";

// Sign-up, verification and password emails go out through Resend, and a
// failed send only ever shows up in the server log. This sends one test
// email to the admin's own address and shows the answer, so a setup problem
// (key, sender, domain) is visible here without digging through logs.
export default async function AdminEmailPage() {
  const session = await requireAdminSession();
  const setup = emailSetup();
  const to = session.user.email;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Email</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Check that the emails comtor sends (sign-up, verification, password reset) get out. The test goes to your own
          address and shows exactly what the email service answered.
        </p>
      </div>

      <dl className="flex flex-col gap-3 rounded bg-fog px-4 py-3 text-sm">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-neutral-500 dark:text-neutral-400">Sender</dt>
          <dd className="break-all font-medium">{setup.from}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-neutral-500 dark:text-neutral-400">Resend API key</dt>
          <dd className="font-medium">{setup.apiKeySet ? "Set" : "Missing, nothing can be sent"}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-neutral-500 dark:text-neutral-400">Environment</dt>
          <dd className="font-medium">{process.env.VERCEL_ENV ?? "local"}</dd>
        </div>
      </dl>

      {setup.usesSharedTestSender && (
        <p className="rounded bg-fog px-4 py-3 text-sm text-ink">
          <span className="font-semibold">EMAIL_FROM isn&apos;t set.</span> Mail goes out from Resend&apos;s shared test
          sender, which only delivers to the address of the Resend account itself. Set EMAIL_FROM to a sender on the
          domain verified in Resend, e.g. comtor &lt;no-reply@comtor.app&gt;.
        </p>
      )}

      {to ? (
        <SendTestEmailButton to={to} />
      ) : (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">This account has no email address to send to.</p>
      )}
    </div>
  );
}
