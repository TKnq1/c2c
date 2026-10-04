import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { Logo } from "@/components/logo";
import { ImprintLink } from "@/components/imprint-link";
import { canonical } from "@/lib/seo";
import { parseSignupRole } from "@/lib/signup-role";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a brand or creator account on comtor.",
  alternates: canonical("/signup"),
};

// ?role=creator or ?role=brand comes from the landing page, which knows which
// side the visitor was looking at (see SignupLink).
export default async function SignupPage(props: PageProps<"/signup">) {
  const t = await getT();
  const initialRole = parseSignupRole((await props.searchParams).role);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <div className="text-center">
          <h1 className="font-display text-title-1 font-bold">{t("screens.ui.createAccount")}</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">{t("screens.ui.getStarted")}</p>
        </div>
        <SignupForm initialRole={initialRole} />
        <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
          {t("screens.ui.alreadyAccount")}{" "}
          <Link href="/login" className="font-medium text-neutral-900 underline dark:text-neutral-100">
            {t("screens.auth.logIn")}
          </Link>
        </p>
        <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
          {t("screens.ui.agreeLead")}{" "}
          <Link href="/legal/terms" className="underline">
            {t("screens.settings.terms")}
          </Link>{" "}
          {t("screens.ui.andWord")}{" "}
          <Link href="/legal/privacy" className="underline">
            {t("screens.settings.privacy")}
          </Link>
          .
        </p>
      </div>
      <ImprintLink />
    </main>
  );
}
