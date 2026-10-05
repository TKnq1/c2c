import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { ConfirmEmailVerificationForm } from "@/components/confirm-email-verification-form";
import { Logo } from "@/components/logo";
import { ImprintLink } from "@/components/imprint-link";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Verify your email", robots: NO_INDEX };

export default async function VerifyEmailTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;

  const verifyToken = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  const isValid = !!verifyToken && !verifyToken.usedAt && verifyToken.expiresAt > new Date();

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-4 text-center">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <h1 className="font-display text-title-1 font-bold">{t("screens.auth.verifyEmail")}</h1>
        {isValid ? (
          <ConfirmEmailVerificationForm token={token} />
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.ui.linkInvalidVerify")}</p>
        )}
      </div>
      <ImprintLink />
    </main>
  );
}
