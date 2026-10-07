"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { OnboardingHeardFrom } from "@/components/onboarding-heard-from";
import type { IconType } from "react-icons";
import { IoCheckmark, IoChevronForward, IoMailOutline, IoPersonOutline, IoSearchOutline, IoSparkles, IoWalletOutline } from "react-icons/io5";

type NextStep = {
  href: string;
  icon: IconType;
  title: string;
  description: string;
};

// The wizard's last screen: what to do next, with the main thing as the
// button and the rest as a short list.
export function OnboardingDone({
  role,
  name,
  emailVerified,
  payoutsStarted,
  foundingNumber = null,
}: {
  role: "brand" | "creator";
  name: string;
  emailVerified: boolean;
  // The creator went through the payout form in the wizard, so there is no
  // need to point at it again.
  payoutsStarted: boolean;
  // The brand got one of the founding places: said once more on the last screen.
  foundingNumber?: number | null;
}) {
  const { t } = useI18n();
  const settings = role === "brand" ? "/dashboard/startup/settings" : "/dashboard/creator/settings";
  const steps: NextStep[] = [
    ...(emailVerified
      ? []
      : [
          {
            href: "/dashboard/verify-email",
            icon: IoMailOutline,
            title: t("onboarding.done.verifyTitle"),
            description: t("onboarding.done.verifyBody"),
          },
        ]),
    ...(role === "brand"
      ? [
          {
            href: "/dashboard/startup/discover",
            icon: IoSearchOutline,
            title: t("onboarding.done.browseTitle"),
            description: t("onboarding.done.browseBody"),
          },
        ]
      : payoutsStarted
        ? []
        : [
            {
              href: `${settings}#payouts`,
              icon: IoWalletOutline,
              title: t("onboarding.done.payoutsTitle"),
              description: t("onboarding.done.payoutsBody"),
            },
          ]),
    {
      href: `${settings}#profile`,
      icon: IoPersonOutline,
      title: t("onboarding.done.profileTitle"),
      description: role === "brand" ? t("onboarding.done.profileBrand") : t("onboarding.done.profileCreator"),
    },
  ];
  const primary =
    role === "brand"
      ? {
          href: "/dashboard/startup/new",
          label: t("onboarding.done.postFirst"),
        }
      : { href: "/dashboard/creator", label: t("onboarding.done.goFeed") };
  const secondary = role === "brand" ? { href: "/dashboard/startup", label: t("onboarding.done.goDashboard") } : null;

  return (
    <div className="flex flex-1 flex-col gap-5 sm:my-auto sm:flex-none">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center sm:flex-none sm:py-2">
        <span className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-full bg-ink text-paper">
          <IoCheckmark className="h-8 w-8" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-title-1 font-bold text-balance">{t("onboarding.done.allSet", { name })}</h1>
          <p className="mt-2 text-pretty text-neutral-600 dark:text-neutral-400">
            {role === "brand" ? t("onboarding.done.brandBody") : t("onboarding.done.creatorBody")}
          </p>
          {foundingNumber && (
            <p className="mt-3 flex items-center justify-center gap-2 rounded bg-fog px-4 py-2.5 text-sm font-medium">
              <IoSparkles className="h-4 w-4 shrink-0" aria-hidden />
              {t(role === "brand" ? "founding.doneLine" : "founding.creator.doneLine", { n: foundingNumber })}
            </p>
          )}
        </div>
      </div>

      <ul className="overflow-hidden rounded bg-fog">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="animate-stagger-fade-in border-ink/10 [&+&]:border-t"
            style={{ animationDelay: `${150 + i * 70}ms` }}
          >
            <Link href={s.href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink/5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
                <s.icon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block text-footnote text-neutral-500 dark:text-neutral-400">{s.description}</span>
              </span>
              <IoChevronForward className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <OnboardingHeardFrom />

      <div className="mt-auto flex flex-col items-center gap-3 pt-2 sm:mt-0">
        <Link
          href={primary.href}
          className="w-full rounded-full bg-ink px-4 py-3.5 text-center font-medium text-paper transition hover:bg-graphite"
        >
          {primary.label}
        </Link>
        {secondary && (
          <Link href={secondary.href} className="px-3 py-2 text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400">
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
