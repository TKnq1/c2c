"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { StepHeading, stepActions, stepScreen } from "@/components/onboarding-ui";
import type { SignupRole } from "@/lib/signup-role";

// "current" is what's live. The other four are the options to look at via
// /onboarding?rolePreview=cards|toggle|text|split before one of them replaces it.
export type RolePreview = "cards" | "toggle" | "text" | "split";

const continueButton =
  "w-full rounded-full bg-ink px-4 py-3.5 font-medium text-paper transition hover:bg-graphite disabled:opacity-40 disabled:hover:bg-ink";

export function OnboardingRoleStep({
  onChoose,
  preview = null,
}: {
  onChoose: (role: SignupRole) => void;
  preview?: RolePreview | null;
}) {
  const { t } = useI18n();
  const title = t("onboarding.role.title");
  const description = t("onboarding.role.description");

  if (preview === "cards") return <RoleCards title={title} description={description} onChoose={onChoose} />;
  if (preview === "toggle") return <RoleToggle title={title} description={description} onChoose={onChoose} />;
  if (preview === "text") return <RoleText title={title} description={description} onChoose={onChoose} />;
  if (preview === "split") return <RoleSplit onChoose={onChoose} />;

  return (
    <div className={stepScreen}>
      <StepHeading title={title} description={description} />
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onChoose("CREATOR")}
          className="w-full rounded-full bg-ink px-4 py-3.5 font-medium text-paper transition hover:bg-graphite"
        >
          {t("screens.auth.imCreator")}
        </button>
        <button
          type="button"
          onClick={() => onChoose("STARTUP")}
          className="w-full rounded-full border border-neutral-300 px-4 py-3.5 font-medium transition hover:border-ink dark:border-neutral-700"
        >
          {t("screens.auth.imBrand")}
        </button>
      </div>
    </div>
  );
}

function RoleCards({
  title,
  description,
  onChoose,
}: {
  title: string;
  description: string;
  onChoose: (role: SignupRole) => void;
}) {
  const { t } = useI18n();
  const cards: { role: SignupRole; label: string; line: string }[] = [
    { role: "CREATOR", label: t("screens.auth.imCreator"), line: t("onboarding.role.creatorLine") },
    { role: "STARTUP", label: t("screens.auth.imBrand"), line: t("onboarding.role.brandLine") },
  ];
  return (
    <div className={stepScreen}>
      <StepHeading title={title} description={description} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.role}
            type="button"
            onClick={() => onChoose(card.role)}
            className="flex h-full flex-col rounded border border-ink/10 bg-fog px-4 py-5 text-left transition hover:border-ink"
          >
            <span className="font-display text-title-3 font-bold">{card.label}</span>
            <span className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{card.line}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoleToggle({
  title,
  description,
  onChoose,
}: {
  title: string;
  description: string;
  onChoose: (role: SignupRole) => void;
}) {
  const { t } = useI18n();
  const [role, setRole] = useState<SignupRole | null>(null);
  const tabs: { role: SignupRole; label: string }[] = [
    { role: "CREATOR", label: t("screens.auth.imCreator") },
    { role: "STARTUP", label: t("screens.auth.imBrand") },
  ];
  return (
    <div className={stepScreen}>
      <StepHeading title={title} description={description} />
      <div className="flex flex-1 flex-col gap-5">
        <div role="group" aria-label={title} className="relative grid w-full grid-cols-2 rounded bg-fog p-1">
          <span
            aria-hidden
            className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900 ${
              role === null ? "opacity-0" : "opacity-100"
            }`}
            style={{ transform: role === "STARTUP" ? "translateX(100%)" : "translateX(0)" }}
          />
          {tabs.map((tab) => (
            <button
              key={tab.role}
              type="button"
              aria-pressed={role === tab.role}
              onClick={() => setRole(tab.role)}
              className={`relative z-10 px-3 py-2.5 text-sm font-medium transition-colors duration-300 ${
                role === tab.role ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={stepActions}>
          <button type="button" disabled={role === null} onClick={() => role && onChoose(role)} className={continueButton}>
            {t("common.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleText({
  title,
  description,
  onChoose,
}: {
  title: string;
  description: string;
  onChoose: (role: SignupRole) => void;
}) {
  const { t } = useI18n();
  const [role, setRole] = useState<SignupRole | null>(null);
  const tabs: { role: SignupRole; label: string }[] = [
    { role: "CREATOR", label: t("screens.auth.imCreator") },
    { role: "STARTUP", label: t("screens.auth.imBrand") },
  ];
  return (
    <div className={stepScreen}>
      <StepHeading title={title} description={description} />
      <div className="flex flex-1 flex-col gap-8">
        <div role="group" aria-label={title} className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.role}
              type="button"
              aria-pressed={role === tab.role}
              onClick={() => setRole(tab.role)}
              className={`border-b-2 pb-1 text-lg font-medium transition-colors ${
                role === tab.role
                  ? "border-ink text-ink"
                  : "border-transparent text-neutral-400 hover:text-ink dark:text-neutral-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={stepActions}>
          <button type="button" disabled={role === null} onClick={() => role && onChoose(role)} className={continueButton}>
            {t("common.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleSplit({ onChoose }: { onChoose: (role: SignupRole) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => onChoose("CREATOR")}
        className="flex flex-1 flex-col justify-end rounded bg-ink px-5 py-6 text-left text-paper transition hover:bg-graphite"
      >
        <span className="font-display text-title-2 font-bold">{t("screens.auth.imCreator")}</span>
        <span className="mt-1 max-w-[24ch] text-sm text-paper/80">{t("onboarding.role.creatorLine")}</span>
      </button>
      <button
        type="button"
        onClick={() => onChoose("STARTUP")}
        className="flex flex-1 flex-col justify-end rounded border border-ink/10 bg-fog px-5 py-6 text-left transition hover:border-ink"
      >
        <span className="font-display text-title-2 font-bold">{t("screens.auth.imBrand")}</span>
        <span className="mt-1 max-w-[24ch] text-sm text-neutral-600 dark:text-neutral-400">{t("onboarding.role.brandLine")}</span>
      </button>
    </div>
  );
}
