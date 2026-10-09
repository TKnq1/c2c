import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { verifyContinueTarget } from "@/lib/verify-continue";
import { ConfirmEmailVerificationForm } from "@/components/confirm-email-verification-form";
import { VerifyContinueLink } from "@/components/verify-continue-link";
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

  const verifyToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { usedAt: true, expiresAt: true, user: { select: { role: true, emailVerified: true } } },
  });
  const isValid = !!verifyToken && !verifyToken.usedAt && verifyToken.expiresAt > new Date();
  // An address that is confirmed by now needs nothing more, whatever became of this link (a second
  // tab, a double tap, a newer link).
  const alreadyVerified = verifyToken?.user.emailVerified === true;
  const next = verifyContinueTarget(verifyToken?.user.role);
  const continueTo = { href: next.href, label: t(next.label) };

  return (
    <LogoBackdrop>
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-display text-title-1 font-bold">{t("screens.auth.verifyEmail")}</h1>
        {alreadyVerified ? (
          <>
            <p className="text-sm text-ink">{t("screens.ui.verifyAlready")}</p>
            <VerifyContinueLink href={continueTo.href} label={continueTo.label} />
          </>
        ) : isValid ? (
          <ConfirmEmailVerificationForm token={token} continueTo={continueTo} />
        ) : (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("screens.ui.linkInvalidVerify")}</p>
            <Link href="/dashboard/verify-email" className="font-medium text-neutral-900 underline dark:text-neutral-100">
              {t("screens.ui.requestNew")}
            </Link>
          </>
        )}
      </div>
      <ImprintLink />
    </LogoBackdrop>
  );
}
