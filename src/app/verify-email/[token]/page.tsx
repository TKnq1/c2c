import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { ConfirmEmailVerificationForm } from "@/components/confirm-email-verification-form";
import { LogoBackdrop } from "@/components/logo-backdrop";
import { ImprintLink } from "@/components/imprint-link";
import type { Metadata } from "next";
import { NO_INDEX, metadataFor } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor({ title: "Verify your email", robots: NO_INDEX }, { title: "E-Mail bestätigen", robots: NO_INDEX });

export default async function VerifyEmailTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;

  const verifyToken = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  const isValid = !!verifyToken && !verifyToken.usedAt && verifyToken.expiresAt > new Date();

  return (
    <LogoBackdrop>
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-display text-title-1 font-bold">{t("screens.auth.verifyEmail")}</h1>
        {isValid ? (
          <ConfirmEmailVerificationForm token={token} />
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.ui.linkInvalidVerify")}</p>
        )}
      </div>
      <ImprintLink />
    </LogoBackdrop>
  );
}
