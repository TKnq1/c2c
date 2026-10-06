"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { foundingSpotsLeftAction } from "@/lib/actions/onboarding-flow";
import { signupFromDraftAction } from "@/lib/actions/onboarding-signup";
import { NewPasswordField } from "@/components/new-password-field";
import { useI18n } from "@/components/i18n-provider";
import { FIELD_CLASS, StepError, StepFooter, StepHeading, stepActions, stepScreen, useStepDone } from "@/components/onboarding-ui";
import type { OnboardingState } from "@/lib/actions/onboarding";
import { localizeError } from "@/lib/i18n/labels";
import { TermsConsent } from "@/components/terms-consent";
import { MarketingConsentCheckbox } from "@/components/marketing-consent-checkbox";
import { keepFieldsOnSubmit } from "@/lib/keep-fields";
import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import type { PlatformDraft } from "@/components/platform-chips";
import type { SignupRole } from "@/lib/signup-role";

function fileFromDataUrl(dataUrl: string): File | null {
  try {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
    if (!match) return null;
    const binary = atob(match[2].replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], "avatar.jpg", { type: match[1] });
  } catch {
    return null;
  }
}

// Email and password, after the person has already seen what they'd get.
// The draft is posted with them and saved in the same request.
export function OnboardingAccountStep({
  role,
  displayName,
  niches,
  platforms,
  companyName,
  niche,
  photoDataUrl,
  onBack,
  onDone,
}: {
  role: SignupRole;
  displayName: string;
  niches: string[];
  platforms: PlatformDraft[];
  companyName: string;
  niche: string;
  photoDataUrl: string | null;
  onBack: () => void;
  onDone: (state: NonNullable<OnboardingState>) => void;
}) {
  const { t } = useI18n();
  // How many of the founding places on this side are still free (nothing is shown when none are).
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    foundingSpotsLeftAction(role).then(
      (left) => live && setSpotsLeft(left),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [role]);
  const [state, submit, pending] = useActionState(async (prev: OnboardingState, formData: FormData) => {
    formData.set("role", role);
    if (role === "CREATOR") {
      formData.set("displayName", displayName.trim());
      formData.set("niches", niches.join(","));
      formData.set(
        "platforms",
        JSON.stringify(
          platforms.map((p) => ({ platform: p.platform, followerCount: Number(p.followers), url: p.url.trim() })),
        ),
      );
    } else {
      formData.set("companyName", companyName.trim());
      formData.set("niche", niche);
    }
    if (photoDataUrl) {
      const file = fileFromDataUrl(photoDataUrl);
      if (file) formData.set("avatar", file);
    }
    return signupFromDraftAction(prev, formData);
  }, undefined);
  useStepDone(state, onDone);

  const fee =
    role === "STARTUP"
      ? t("screens.auth.feeBrand", { standard: PLATFORM_FEE_RATE * 100, pro: PRO_PLATFORM_FEE_RATE * 100 })
      : t("screens.auth.feeCreator", {
          keep: 100 - PLATFORM_FEE_RATE * 100,
          keepPro: 100 - PRO_PLATFORM_FEE_RATE * 100,
          days: RELEASE_REVIEW_DAYS,
        });

  return (
    <form onSubmit={keepFieldsOnSubmit(submit)} className={stepScreen}>
      <StepHeading
        title={t("onboarding.account.title")}
        description={role === "STARTUP" ? t("onboarding.account.brandDescription") : t("onboarding.account.description")}
      />
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("screens.auth.email")}</span>
          <input
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            inputMode="email"
            className={FIELD_CLASS}
          />
        </label>
        <NewPasswordField name="password" className="px-4 py-4 text-lg" />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{fee}</p>
        {spotsLeft !== null && spotsLeft > 0 && (
          <p className="rounded bg-fog px-4 py-3 text-sm font-medium">
            {role === "STARTUP"
              ? spotsLeft === 1
                ? t("founding.teaserLast", { total: FOUNDING_BRAND_LIMIT })
                : t("founding.teaser", { total: FOUNDING_BRAND_LIMIT, left: spotsLeft })
              : spotsLeft === 1
                ? t("founding.creator.teaserLast", { total: FOUNDING_CREATOR_LIMIT })
                : t("founding.creator.teaser", { total: FOUNDING_CREATOR_LIMIT, left: spotsLeft })}
          </p>
        )}
      </div>
      {state?.error && <StepError state={{ error: localizeError(state.error, t) }} />}
      <div className={stepActions}>
        <TermsConsent />
        <MarketingConsentCheckbox />
        <StepFooter onBack={onBack} pending={pending} label={t("screens.auth.create")} />
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          {t("screens.ui.alreadyAccount")}{" "}
          <Link href="/login" className="font-medium text-ink underline">
            {t("screens.auth.logIn")}
          </Link>
        </p>
      </div>
    </form>
  );
}
