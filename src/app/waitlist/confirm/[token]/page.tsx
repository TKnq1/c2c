import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LogoBackdrop } from "@/components/logo-backdrop";
import { ImprintLink } from "@/components/imprint-link";
import { ConfirmWaitlistForm, WaitlistConfirmed } from "@/components/confirm-waitlist-form";
import { NO_INDEX, metadataFor } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor({ title: "Confirm your email", robots: NO_INDEX }, { title: "E-Mail bestätigen", robots: NO_INDEX });

// Where the waitlist's confirmation email leads (see joinWaitlistAction).
// Opening it confirms nothing yet; the button does.
export default async function ConfirmWaitlistPage({ params }: PageProps<"/waitlist/confirm/[token]">) {
  const { token } = await params;
  const entry = await prisma.waitlistEntry.findUnique({
    where: { confirmToken: token },
    select: { email: true, confirmedAt: true },
  });

  return (
    <LogoBackdrop>
      <div className="flex flex-col gap-4 text-center">
        {!entry ? (
          <>
            <h1 className="font-display text-title-1 font-bold">This link doesn&apos;t work anymore</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Leave your email on comtor.app again to get a new one.
            </p>
            <Link href="/#get-the-app" className="font-medium underline underline-offset-2">
              Go to comtor.app
            </Link>
          </>
        ) : entry.confirmedAt ? (
          <WaitlistConfirmed />
        ) : (
          <ConfirmWaitlistForm token={token} email={entry.email} />
        )}
      </div>
      <ImprintLink />
    </LogoBackdrop>
  );
}
