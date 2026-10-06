"use client";

import { useActionState, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { saveDisplayNameAction, saveNichesAction, savePlatformsAction } from "@/lib/actions/onboarding";
import {
  previewCreatorMatchesAction,
  previewNicheInsightAction,
  previewReachInsightAction,
} from "@/lib/actions/onboarding-flow";
import { NicheTilesMulti } from "@/components/niche-tiles";
import { MAX_CREATOR_NICHES } from "@/lib/constants";
import { PlatformChips, type PlatformDraft } from "@/components/platform-chips";
import { useI18n } from "@/components/i18n-provider";
import { OnboardingLanguageStep } from "@/components/onboarding-language-step";
import { OnboardingPhotoStep } from "@/components/onboarding-photo-step";
import { OnboardingDone } from "@/components/onboarding-done";
import { CreatorAha } from "@/components/onboarding-aha";
import { OnboardingSwipeDemo } from "@/components/onboarding-swipe-demo";
import { OnboardingPayoutStep, PAYOUTS_AVAILABLE } from "@/components/onboarding-payout-step";
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
import { CREATOR_STEPS, type OnboardingEventKind, type OnboardingInsight, type OnboardingStepKey } from "@/lib/onboarding-flow";
import { ONBOARDING_ACCOUNT_EVENT } from "@/components/onboarding-exit";
import { clearOnboardingDraft, readOnboardingDraft, writeOnboardingDraft } from "@/lib/onboarding-draft";
import { trackOnboarding, useTrackStepViews } from "@/lib/use-onboarding-tracking";

// Guests answer through the payoff first, then create the account. Someone
// who already signed up (an older account, still incomplete) keeps saving
// each step and never sees the account step again.
const SETUP_STEPS = CREATOR_STEPS.slice(0, 5);
const ACCOUNT_STEP = CREATOR_STEPS.findIndex((s) => s.key === "account");
const BAR_STEPS = CREATOR_STEPS.slice(0, ACCOUNT_STEP + 1);

type StepDef = {
  key: OnboardingStepKey;
  render: (index: number) => React.ReactNode;
};

export function CreatorOnboarding({
  emailVerified,
  mode = "account",
  onLeave,
}: {
  emailVerified: boolean;
  mode?: "guest" | "account";
  // Guests can step back out to the creator/brand choice.
  onLeave?: () => void;
}) {
  const { t } = useI18n();
  const guest = mode === "guest";
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformDraft[]>([]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [booted, setBooted] = useState(!guest);
  const [insights, setInsights] = useState<{
    niches?: OnboardingInsight;
    platforms?: OnboardingInsight;
  }>({});
  const [payoutsStarted, setPayoutsStarted] = useState(false);
  const pushOffer = usePushOffer();
  const sealed = useRef(false);

  const name = displayName.trim();
  const back = (i: number) => setStep(i - 1);

  useLayoutEffect(() => {
    if (!guest) return;
    const draft = readOnboardingDraft();
    queueMicrotask(() => {
      if (draft?.role === "CREATOR") {
        setDisplayName(draft.displayName);
        setNiches(draft.niches);
        setPlatforms(draft.platforms);
        setPhotoDataUrl(draft.photoDataUrl);
        setSkipped(draft.skipped);
        setStep(Math.min(draft.step, ACCOUNT_STEP));
        if (draft.niches.length) {
          previewNicheInsightAction(draft.niches).then((insight) => {
            if (insight) setInsights((prev) => ({ ...prev, niches: insight }));
          });
        }
        const counts = draft.platforms.map((p) => Number(p.followers)).filter((n) => Number.isInteger(n) && n >= 0);
        if (draft.niches.length && counts.length === draft.platforms.length && counts.length > 0) {
          previewReachInsightAction({
            niches: draft.niches,
            platforms: counts.map((followerCount) => ({ followerCount })),
          }).then((insight) => {
            if (insight) setInsights((prev) => ({ ...prev, platforms: insight }));
          });
        }
      }
      setBooted(true);
    });
  }, [guest]);

  useEffect(() => {
    if (!guest || !booted || sealed.current) return;
    writeOnboardingDraft({
      role: "CREATOR",
      step,
      displayName,
      niches,
      platforms,
      companyName: "",
      niche: "",
      photoDataUrl,
      skipped,
    });
  }, [guest, booted, step, displayName, niches, platforms, photoDataUrl, skipped]);

  const loadMatches = useCallback(
    () =>
      previewCreatorMatchesAction({
        niches,
        platforms: platforms.map((p) => ({ platform: p.platform, followerCount: Number(p.followers), url: p.url.trim() })),
      }),
    [niches, platforms],
  );

  // Every step reports how it ended, then the wizard moves on. Math.max so
  // a step finished again after going Back doesn't send it backwards.
  // Guest steps are recorded once the account exists (the cookie is set by
  // then); before that the tracker has nobody to attach them to.
  function finish(i: number, kind: OnboardingEventKind = "completed") {
    const key = defs[i].key;
    if (kind === "skipped") setSkipped((prev) => (prev.includes(key) ? prev : [...prev, key]));
    trackOnboarding(key, kind);
    // Only the step on screen may move the wizard. A late save from a step
    // they already left must not jump them, and Continue after Back walks
    // forward one step instead of skipping to the furthest one.
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
      key: "name",
      render: (i) => (
        <NameStep guest={guest} value={displayName} onChange={setDisplayName} onBack={() => back(i)} onDone={() => finish(i)} />
      ),
    },
    {
      key: "niches",
      render: (i) => (
        <NichesStep
          guest={guest}
          value={niches}
          onChange={setNiches}
          onBack={() => back(i)}
          onDone={(insight) => {
            setInsights((prev) => ({ ...prev, niches: insight }));
            finish(i);
          }}
        />
      ),
    },
    {
      key: "platforms",
      render: (i) => (
        <PlatformsStep
          guest={guest}
          niches={niches}
          value={platforms}
          onChange={setPlatforms}
          insight={insights.niches}
          onBack={() => back(i)}
          onDone={(insight) => {
            setInsights((prev) => ({ ...prev, platforms: insight }));
            finish(i);
          }}
        />
      ),
    },
    {
      key: "photo",
      render: (i) => (
        <>
          <InsightBanner insight={insights.platforms} />
          <OnboardingPhotoStep
            kind="photo"
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
      key: "matches",
      render: (i) => (
        <CreatorAha
          active={step === i}
          name={name}
          guest={guest}
          load={guest ? loadMatches : undefined}
          onBack={() => back(i)}
          onNext={() => finish(i)}
        />
      ),
    },
    {
      key: "swipe",
      render: (i) => (
        <OnboardingSwipeDemo active={step === i} onBack={() => back(i)} onNext={() => finish(i)} onSkip={() => finish(i, "skipped")} />
      ),
    },
    ...(guest
      ? [
          {
            key: "account" as const,
            render: (i: number) => (
              <OnboardingAccountStep
                role="CREATOR"
                displayName={displayName}
                niches={niches}
                platforms={platforms}
                companyName=""
                niche=""
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
    ...(PAYOUTS_AVAILABLE
      ? [
          {
            key: "payouts" as const,
            render: (i: number) => (
              <OnboardingPayoutStep
                onBack={() => back(i)}
                onDone={() => {
                  setPayoutsStarted(true);
                  finish(i);
                }}
                onSkip={() => finish(i, "skipped")}
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
              <OnboardingPushStep role="creator" onBack={() => back(i)} onDone={() => finish(i)} onSkip={() => finish(i, "skipped")} />
            ),
          },
        ]
      : []),
  ];

  const finished = step >= defs.length;
  useTrackStepViews(finished ? "done" : defs[step]?.key);

  if (guest && !booted) return <div className="flex flex-1" />;

  if (finished) {
    return <OnboardingDone role="creator" name={name} emailVerified={emailVerified} payoutsStarted={payoutsStarted} />;
  }

  const bar = guest ? BAR_STEPS : SETUP_STEPS;
  const inBar = step < bar.length;
  return (
    <div className="flex flex-1 flex-col gap-5 sm:my-auto sm:flex-none">
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

function NameStep({
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
  const [state, formAction, pending] = useActionState(saveDisplayNameAction, undefined);
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
      <StepHeading title={t("onboarding.name.title")} description={t("onboarding.name.description")} />
      <input
        name="displayName"
        type="text"
        required
        autoFocus
        autoComplete="nickname"
        placeholder={t("onboarding.name.placeholder")}
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

function NichesStep({
  guest,
  value,
  onChange,
  onBack,
  onDone,
}: {
  guest: boolean;
  value: string[];
  onChange: (v: string[]) => void;
  onBack: () => void;
  onDone: (insight?: OnboardingInsight) => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [state, formAction, pending] = useActionState(saveNichesAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));

  async function keepLocally(e: React.FormEvent) {
    e.preventDefault();
    if (value.length === 0 || busy) return;
    setBusy(true);
    const insight = await previewNicheInsightAction(value).catch(() => null);
    onDone(insight ?? undefined);
    setBusy(false);
  }

  return (
    <form action={guest ? undefined : formAction} onSubmit={guest ? keepLocally : undefined} className={stepScreen}>
      <StepHeading
        title={t("onboarding.niches.title")}
        description={t("onboarding.niches.description", {
          max: MAX_CREATOR_NICHES,
        })}
      />
      <NicheTilesMulti name="niches" value={value} onChange={onChange} />
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter onBack={onBack} pending={guest ? busy : pending} disabled={value.length === 0} />
      </div>
    </form>
  );
}

function PlatformsStep({
  guest,
  niches,
  value,
  onChange,
  insight,
  onBack,
  onDone,
}: {
  guest: boolean;
  niches: string[];
  value: PlatformDraft[];
  onChange: (v: PlatformDraft[]) => void;
  insight: OnboardingInsight | undefined;
  onBack: () => void;
  onDone: (insight?: OnboardingInsight) => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [state, formAction, pending] = useActionState(savePlatformsAction, undefined);
  useStepDone(state, (s) => onDone(s.insight));
  const complete = value.length > 0 && value.every((e) => e.followers !== "" && e.url.trim() !== "");

  async function keepLocally(e: React.FormEvent) {
    e.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    const insight = await previewReachInsightAction({
      niches,
      platforms: value.map((p) => ({ followerCount: Number(p.followers) })),
    }).catch(() => null);
    onDone(insight ?? undefined);
    setBusy(false);
  }

  return (
    <form action={guest ? undefined : formAction} onSubmit={guest ? keepLocally : undefined} className={stepScreen}>
      <div>
        <InsightBanner insight={insight} />
        <StepHeading title={t("onboarding.platforms.title")} description={t("onboarding.platforms.description")} />
      </div>
      <PlatformChips name="platforms" value={value} onChange={onChange} />
      <StepError state={state} />
      <div className={stepActions}>
        <StepFooter onBack={onBack} pending={guest ? busy : pending} disabled={!complete} />
      </div>
    </form>
  );
}
