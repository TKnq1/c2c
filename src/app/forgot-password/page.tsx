import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { LogoBackdrop } from "@/components/logo-backdrop";
import { ImprintLink } from "@/components/imprint-link";
import { NO_INDEX, metadataFor } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor({ title: "Reset your password", robots: NO_INDEX }, { title: "Passwort zurücksetzen", robots: NO_INDEX });

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <LogoBackdrop>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-display text-title-1 font-bold">{t("screens.ui.resetTitle")}</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">{t("screens.ui.resetHint")}</p>
        </div>
        <ForgotPasswordForm />
        <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
          <Link href="/login" className="font-medium text-neutral-900 underline dark:text-neutral-100">
            {t("screens.ui.backToLogin")}
          </Link>
        </p>
      </div>
      <ImprintLink />
    </LogoBackdrop>
  );
}
