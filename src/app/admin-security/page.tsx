import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { adminTwoFactorRequired } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { TwoFactorSettings } from "@/components/two-factor-settings";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Admin security", robots: NO_INDEX };

// Outside /admin on purpose: the admin layout sends everyone without two-factor authentication here,
// so this page can't sit under it. Admin accounts need two-factor authentication because what they can
// do (delete accounts, release or refund payments, mail people) is what an attacker would want.
export default async function AdminSecurityPage() {
  const session = await auth();
  if (!session || !hasAdminAccess(session.user)) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { totpEnabled: true } });
  const enabled = user?.totpEnabled === true;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <div>
          <h1 className="font-display text-title-1 font-bold">Admin security</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {enabled
              ? "Two-factor authentication is on. You can open the admin area."
              : adminTwoFactorRequired()
                ? "Admin accounts need two-factor authentication. Switch it on to open the admin area."
                : "Two-factor authentication is optional for admins right now. We recommend it."}
          </p>
        </div>
        <div className="rounded bg-fog p-4">
          <TwoFactorSettings initialEnabled={enabled} />
        </div>
        {(enabled || !adminTwoFactorRequired()) && (
          <Link
            href="/admin"
            className="self-start rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite"
          >
            Open the admin area
          </Link>
        )}
      </div>
    </main>
  );
}
