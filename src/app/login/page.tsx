import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { DeletedAccountToast } from "@/components/deleted-account-toast";
import { LogoBackdrop } from "@/components/logo-backdrop";
import { ImprintLink } from "@/components/imprint-link";
import { WelcomeLogoPreload } from "@/components/welcome-overlay";
import { canonical, metadataFor } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor(
    { title: "Log in", description: "Log in to comtor.", alternates: canonical("/login") },
    { title: "Anmelden", description: "Melde dich bei comtor an.", alternates: canonical("/login") },
  );

export default async function LoginPage() {
  const t = await getT();
  return (
    <LogoBackdrop>
      <DeletedAccountToast />
      <WelcomeLogoPreload />
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-display text-title-1 font-bold">{t("screens.auth.welcome")}</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">{t("screens.auth.loginHint")}</p>
        </div>
        <LoginForm />
        <p className="text-sm text-center text-neutral-600 flex flex-col gap-1 dark:text-neutral-400">
          <Link href="/forgot-password" className="font-medium text-neutral-900 underline dark:text-neutral-100">
            {t("screens.auth.forgot")}
          </Link>
          <span>
            {t("screens.auth.noAccount")}{" "}
            <Link href="/signup" className="font-medium text-neutral-900 underline dark:text-neutral-100">
              {t("screens.auth.signUp")}
            </Link>
          </span>
        </p>
      </div>
      <ImprintLink />
    </LogoBackdrop>
  );
}
