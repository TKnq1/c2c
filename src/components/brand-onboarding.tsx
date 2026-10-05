"use client";

import { useActionState, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { saveCompanyNameAction, saveBrandNicheAction } from "@/lib/actions/onboarding";
import { previewBrandCreatorsAction, previewBrandNicheInsightAction } from "@/lib/actions/onboarding-flow";
import { NicheTiles } from "@/components/niche-tiles";
import { useI18n } from "@/components/i18n-provider";
import { OnboardingLanguageStep } from "@/components/onboarding-language-step";
import { OnboardingPhotoStep } from "@/components/onboarding-photo-step";
import { OnboardingDone } from "@/components/onboarding-done";
import { BrandAha } from "@/components/onboarding-aha";
import { OnboardingAccountStep } from "@/components/onboarding-account-step";
import { OnboardingPushStep, usePushOffer } from "@/components/onboarding-push-step";
import {
  FIELD_CLASS,
  InsightBanner,
  OnboardingProgress,
  StepError,
  StepFooter,
  StepHeading,
  StepPanels,
  stepActions,
  stepScreen,
  useStepDone,
} from "@/components/onboarding-ui";
import type { MessageKey } from "@/lib/i18n/translate";
import { BRAND_STEPS, type OnboardingEventKind, type OnboardingInsight, type OnboardingStepKey } from "@/lib/onboarding-flow";
import { ONBOARDING_ACCOUNT_EVENT } from "@/components/onboarding-exit";
import { clearOnboardingDraft, readOnboardingDraft, writeOnboardingDraft } from "@/lib/onboarding-draft";
import { trackOnboarding, useTrackStepViews } from "@/lib/use-onboarding-tracking";

// Guests meet the creators in their niche before they create an account.
// Someone who already has an incomplete account keeps saving each step.
const SETUP_STEPS = BRAND_STEPS.slice(0, 4);
const ACCOUNT_STEP = BRAND_STEPS.findIndex((s) => s.key === "account");
const BAR_STEPS = BRAND_STEPS.slice(0, ACCOUNT_STEP + 1);

type StepDef = {
  key: OnboardingStepKey;
  render: (index: number) => React.ReactNode;
};

export function BrandOnboarding({
  emailVerified,
  mode = "account",
  onLeave,
}: {
  emailVerified: boolean;
  mode?: "guest" | "account";
  onLeave?: () => void;
}) {
  const { t } = useI18n();
  const guest = mode === "guest";
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [niche, setNiche] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [booted, setBooted] = useState(!guest);
  const [nicheInsight, setNicheInsight] = useState<OnboardingInsight | undefined>();
  const pushOffer = usePushOffer();
  const sealed = useRef(false);

  const name = companyName.trim();
  const back = (i: number) => setStep(i - 1);

  useLayoutEffect(() => {
    if (!guest) return;
    const draft = readOnboardingDraft();
    queueMicrotask(() => {
      if (draft?.role === "STARTUP") {
        setCompanyName(draft.companyName);
        setNiche(draft.niche);
        setPhotoDataUrl(draft.photoDataUrl);
        setSkipped(draft.skipped);
        setStep(Math.min(draft.step, ACCOUNT_STEP));
        if (draft.niche) {
          previewBrandNicheInsightAction(draft.niche).then((insight) => {
            if (insight) setNicheInsight(insight);
          });
        }
      }
      setBooted(true);
    });
  }, [guest]);

  useEffect(() => {
    if (!guest || !booted || sealed.current) return;
    writeOnboardingDraft({
      role: "STARTUP",
      step,
      displayName: "",
      niches: [],
      platforms: [],
      companyName,
      niche,
      photoDataUrl,
      skipped,
    });
  }, [guest, booted, step, companyName, niche, photoDataUrl, skipped]);

  const loadCreators = useCallback(() => previewBrandCreatorsAction(niche), [niche]);

  function finish(i: number, kind: OnboardingEventKind = "completed") {
    const key = defs[i].key;
    if (kind === "skipped") setSkipped((prev) => (prev.includes(key) ? prev : [...prev, key]));
    trackOnboarding(key, kind);
    setStep((s) => (s === i ? i + 1 : s));
  }

  function replayGuestSteps(accountIndex: number) {
    sealed.current = true;
    clearOnboardingDraft();
    window.dispatchEvent(new Event(ONBOARDING_ACCOUNT_EVENT));
    for (let n = 0; n <= accountIndex; n++) {
      const key = defs[n].key;
      trackOnboarding(key, "viewed");
      if (n < accountIndex) {
        const kind: OnboardingEventKind = skipped.includes(key) ? "skipped" : "completed";
        trackOnboarding(key, kind);
      }
    }
  }

  const defs: StepDef[] = [
    {
      key: "language",
      render: (i) => <OnboardingLanguageStep onDone={() => finish(i)} onBack={onLeave} />,
    },
    {
      key: "company",
      render: (i) => (
        <CompanyNameStep guest={guest} value={companyName} onChange={setCompanyName} onBack={() => back(i)} onDone={() => finish(i)} />
      ),
    },
    {
      key: "niche",
      render: (i) => (
        <NicheStep
          guest={guest}
          value={niche}
          onChange={setNiche}
          onBack={() => back(i)}
          onDone={(insight) => {
            setNicheInsight(insight);
            finish(i);
          }}
        />
      ),
    },
    {
      key: "logo",
      render: (i) => (
        <>
          <InsightBanner insight={nicheInsight} />
          <OnboardingPhotoStep
            kind="logo"
            deferUpload={guest}
            initialPreview={photoDataUrl}
            onPreview={setPhotoDataUrl}
            onBack={() => back(i)}
            onDone={() => finish(i)}
            onSkip={() => finish(i, "skipped")}
          />
        </>
      ),
    },
    {
      key: "creators",
      render: (i) => (
        <BrandAha active={step === i} guest={guest} load={guest ? loadCreators : undefined} onBack={() => back(i)} onNext={() => finish(i)} />
      ),
    },
    ...(guest
      ? [
          {
            key: "account" as const,
            render: (i: number) => (
              <OnboardingAccountStep
                role="STARTUP"
                displayName=""
                niches={[]}
                platforms={[]}
                companyName={companyName}
                niche={niche}
                photoDataUrl={photoDataUrl}
                onBack={() => back(i)}
                onDone={() => {
                  replayGuestSteps(i);
                  finish(i);
                }}
              />
            ),
          },
        ]
      : []),
    ...(pushOffer
      ? [
          {
            key: "alerts" as const,
            render: (i: number) => (
              <OnboardingPushStep role="brand" onBack={() => back(i)} onDone={() => finish(i)} onSkip={() => finish(i, "skipped")} />
            ),
          },
        ]
      : []),
  ];

  const finished = step >= defs.length;
  useTrackStepViews(finished ? "done" : defs[step]?.key);

  if (guest && !booted) return <div className="flex flex-1" />;

  if (finished) {
    return <OnboardingDone role="brand" name={name} emailVerified={emailVerified} payoutsStarted={false} />;
  }

  const bar = guest ? BAR_STEPS : SETUP_STEPS;
  const inBar = step < bar.length;
  return (
    <div className="flex flex-1 flex-col gap-5">
      {inBar && (
        <OnboardingProgress
          step={step}
          total={bar.length}
          labels={bar.map((s) => t(`onboarding.steps.${s.key}` as MessageKey))}
        />
      )}
      <StepPanels step={step}>{defs.map((d, i) => d.render(i))}</StepPanels>
    </div>
  );
}

function CompanyNameStep({
  guest,
  value,
  onChange,
  onBack,
  onDone,
}: {
  guest: boolean;
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(saveCompanyNameAction, undefined);
  useStepDone(state, onDone);

  return (
    <form
      action={guest ? undefined : formAction}
      onSubmit={
        guest
          ? (e) => {
              e.preventDefault();
              if (value.trim()) onDone();
            }
          : undefined
      }
      className={stepScreen}
    >
      <StepHeading title={t("onboarding.company.title")} description={t("onboarding.company.description")} />
      <input
        name="companyName"
        type="text"
        required
        autoFocus
        autoComplete="organization"
        placeholder={t("onboarding.company.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLASS}
      />
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter onBack={onBack} pending={guest ? false : pending} disabled={!value.trim()} />
      </div>
    </form>
  );
}

function NicheStep({
  guest,
  value,
  onChange,
  onBack,
  onDone,
}: {
  guest: boolean;
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onDone: (insight?: OnboardingInsight) => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [state, formAction, pending] = useActionState(saveBrandNicheAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));

  async function keepLocally(e: React.FormEvent) {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    const insight = await previewBrandNicheInsightAction(value).catch(() => null);
    onDone(insight ?? undefined);
    setBusy(false);
  }

  return (
    <form action={guest ? undefined : formAction} onSubmit={guest ? keepLocally : undefined} className={stepScreen}>
      <StepHeading title={t("onboarding.brandNiche.title")} description={t("onboarding.brandNiche.description")} />
      <NicheTiles name="niche" value={value} onChange={onChange} />
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter onBack={onBack} pending={guest ? busy : pending} disabled={!value} />
      </div>
    </form>
  );
}
