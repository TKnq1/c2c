import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { DeletedAccountToast } from "@/components/deleted-account-toast";
import { Logo } from "@/components/logo";
import { ImprintLink } from "@/components/imprint-link";
import { WelcomeLogoPreload } from "@/components/welcome-overlay";
import { canonical } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Log in", alternates: canonical("/login") };

export default async function LoginPage() {
  const t = await getT();
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <DeletedAccountToast />
      <WelcomeLogoPreload />
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
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
    </main>
  );
}
