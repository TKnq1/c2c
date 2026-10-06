import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { LogoBackdrop } from "@/components/logo-backdrop";
import { ImprintLink } from "@/components/imprint-link";
import { ConfirmMarketingForm, MarketingConfirmed } from "@/components/confirm-marketing-form";
import { NO_INDEX, metadataFor } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor({ title: "Confirm product news", robots: NO_INDEX }, { title: "Produkt-News bestätigen", robots: NO_INDEX });

function settingsHref(role: string) {
  if (role === "STARTUP") return "/dashboard/startup/settings#news";
  if (role === "CREATOR") return "/dashboard/creator/settings#news";
  return "/login";
}

// Opening the link confirms nothing. Mail scanners fetch every URL, so the
// button on this page is the consent (see confirmMarketingConsent).
export default async function ConfirmMarketingPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;
  const user = await prisma.user.findUnique({
    where: { marketingTokenHash: hashToken(token) },
    select: { role: true, deletedAt: true, marketingConsentAt: true, marketingTokenExpiresAt: true },
  });
  const expired = !user?.marketingTokenExpiresAt || user.marketingTokenExpiresAt <= new Date();
  const usable = !!user && !user.deletedAt && !expired;

  return (
    <LogoBackdrop>
      <div className="flex flex-col gap-4 text-center">
        {!usable ? (
          <>
            <h1 className="font-display text-title-1 font-bold">{t("screens.marketing.linkInvalid")}</h1>
            <Link href="/login" className="font-medium underline underline-offset-2">
              {t("screens.ui.backToLogin")}
            </Link>
          </>
        ) : user.marketingConsentAt ? (
          <MarketingConfirmed settingsHref={settingsHref(user.role)} />
        ) : (
          <ConfirmMarketingForm token={token} settingsHref={settingsHref(user.role)} />
        )}
      </div>
      <ImprintLink />
    </LogoBackdrop>
  );
}
