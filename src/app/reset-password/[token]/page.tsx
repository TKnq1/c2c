import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { LogoBackdrop } from "@/components/logo-backdrop";
import { ImprintLink } from "@/components/imprint-link";
import type { Metadata } from "next";
import { NO_INDEX, metadataFor } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor({ title: "Choose a new password", robots: NO_INDEX }, { title: "Neues Passwort wählen", robots: NO_INDEX });

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  const isValid = !!resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  return (
    <LogoBackdrop>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-display text-title-1 font-bold">{t("screens.ui.setNewPassword")}</h1>
        </div>
        {isValid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
            {t("screens.ui.linkInvalidReset")}{" "}
            <Link href="/forgot-password" className="font-medium text-neutral-900 underline dark:text-neutral-100">
              {t("screens.ui.requestNew")}
            </Link>
          </p>
        )}
      </div>
      <ImprintLink />
    </LogoBackdrop>
  );
}
