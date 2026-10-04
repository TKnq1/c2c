"use client";

import { useEffect, useRef, useState } from "react";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { Confetti } from "@/components/confetti";
import { useI18n } from "@/components/i18n-provider";
import { PRIMARY_BUTTON, stepActions, stepScreen, useCountUp } from "@/components/onboarding-ui";
import {
  getBrandCreatorsAction,
  getCreatorMatchesAction,
  type BrandCreatorsResult,
  type CreatorMatchesResult,
} from "@/lib/actions/onboarding-flow";
import { PLATFORM_FEE_RATE } from "@/lib/constants";
import { nicheLabel, presetLabel } from "@/lib/i18n/labels";
import { hapticSuccess } from "@/lib/haptics";
import { playSound } from "@/lib/sounds";

// Long enough that "finding your matches" reads as the app looking, short
// enough not to be a wait of its own.
const MIN_LOADING_MS = 1100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Loads once, when the step first becomes the current one — the wizard keeps
// every step mounted, and this one has to see the profile that was just
// saved.
function useAhaData<T>(active: boolean, load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    Promise.all([load(), sleep(MIN_LOADING_MS)]).then(
      ([result]) => setData(result),
      () => setFailed(true),
    );
  }, [active, load]);

  return { data, failed };
}

function Looking({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center" role="status">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-splash.png" alt="" width={72} height={72} className="app-splash-logo dark:invert" />
      <p className="text-neutral-600 dark:text-neutral-400">{title}</p>
    </div>
  );
}

function Celebrate() {
  useEffect(() => {
    hapticSuccess();
    playSound("success", 0.5);
  }, []);
  return <Confetti />;
}

function BigNumber({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value, 1100);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="font-display text-[3.75rem] leading-none font-black tabular-nums">{shown}</p>
      <p className="text-balance text-neutral-600 dark:text-neutral-400">{label}</p>
    </div>
  );
}

export function CreatorAha({
  active,
  name,
  onNext,
  load = getCreatorMatchesAction,
  guest = false,
}: {
  active: boolean;
  name: string;
  onNext: () => void;
  load?: () => Promise<CreatorMatchesResult>;
  guest?: boolean;
}) {
  const { t } = useI18n();
  const { data, failed } = useAhaData<CreatorMatchesResult>(active, load);

  if (failed || (data && "error" in data)) {
    return (
      <div className={stepScreen}>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t(guest ? "onboarding.aha.loadFailedCreatorGuest" : "onboarding.aha.loadFailedCreator")}
        </p>
        <div className={stepActions}>
          <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} w-full`}>
            {t("common.continue")}
          </button>
        </div>
      </div>
    );
  }
  if (!data) return <Looking title={t("onboarding.aha.lookingRequests")} />;

  const keep = Math.round((1 - PLATFORM_FEE_RATE) * 100);

  if (data.matches === 0) {
    return (
      <div className={`animate-stagger-fade-in ${stepScreen}`}>
        <div>
          <h1 className="font-display text-title-1 font-bold text-balance">{t("onboarding.aha.earlyCreator", { name })}</h1>
          <p className="mt-2 text-pretty text-neutral-600 dark:text-neutral-400">
            {data.fitsReach > 0
              ? t("onboarding.aha.earlyReach", {
                  count: data.fitsReach,
                  requests: data.fitsReach === 1 ? t("onboarding.insight.requestOne") : t("onboarding.insight.requestMany"),
                  them: data.fitsReach === 1 ? t("onboarding.aha.it") : t("onboarding.aha.them"),
                })
              : t("onboarding.aha.earlyNone")}
          </p>
        </div>
        <Trust keep={keep} />
        <div className={stepActions}>
          <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} w-full`}>
            {t("onboarding.aha.showHow")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={stepScreen}>
      <Celebrate />
      <div className="flex flex-1 flex-col justify-center gap-5">
        <BigNumber
          value={data.matches}
          label={t("onboarding.aha.matchesYou", {
            matches: data.matches === 1 ? t("onboarding.aha.requestMatches") : t("onboarding.aha.requestsMatch"),
            name,
          })}
        />

        <ul className="flex flex-col gap-2">
          {data.top.map((r, i) => (
            <li
              key={r.id}
              className="animate-stagger-fade-in flex items-center gap-3 rounded bg-fog px-4 py-3"
              style={{ animationDelay: `${600 + i * 120}ms` }}
            >
              <Avatar src={r.companyAvatarUrl} name={r.companyName} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{r.title}</span>
                <span className="block truncate text-footnote text-neutral-500 dark:text-neutral-400">
                  {r.companyName} ·{" "}
                  {r.deliverables && r.platform
                    ? t("onboarding.aha.deal", {
                        deliverables: presetLabel(t, r.deliverables),
                        platform: r.platform,
                      })
                    : nicheLabel(t, r.niche)}
                </span>
              </span>
              {r.budget && <span className="shrink-0 text-sm font-black">{r.budget}</span>}
            </li>
          ))}
        </ul>
        {data.matches > data.top.length && (
          <p className="-mt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t("onboarding.aha.andMore", {
              count: data.matches - data.top.length,
            })}
          </p>
        )}

        <Trust keep={keep} />
      </div>
      <div className={stepActions}>
        <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} w-full`}>
          {t("onboarding.aha.showHow")}
        </button>
      </div>
    </div>
  );
}

function Trust({ keep }: { keep: number }) {
  const { t } = useI18n();
  return (
    <p className="flex items-start gap-3 rounded bg-fog px-4 py-3.5 text-sm text-neutral-700 dark:text-neutral-300">
      <IoShieldCheckmarkOutline className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
      <span>{t("onboarding.aha.trust", { keep })}</span>
    </p>
  );
}

export function BrandAha({
  active,
  onNext,
  load = getBrandCreatorsAction,
  guest = false,
}: {
  active: boolean;
  onNext: () => void;
  load?: () => Promise<BrandCreatorsResult>;
  guest?: boolean;
}) {
  const { t } = useI18n();
  const { data, failed } = useAhaData<BrandCreatorsResult>(active, load);

  if (failed || (data && "error" in data)) {
    return (
      <div className={stepScreen}>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t(guest ? "onboarding.aha.loadFailedBrandGuest" : "onboarding.aha.loadFailedBrand")}
        </p>
        <div className={stepActions}>
          <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} w-full`}>
            {t("common.continue")}
          </button>
        </div>
      </div>
    );
  }
  if (!data) return <Looking title={t("onboarding.aha.lookingCreators")} />;

  if (data.creators === 0) {
    return (
      <div className={`animate-stagger-fade-in ${stepScreen}`}>
        <div>
          <h1 className="font-display text-title-1 font-bold text-balance">{t("onboarding.aha.earlyBrand")}</h1>
          <p className="mt-2 text-pretty text-neutral-600 dark:text-neutral-400">
            {t("onboarding.aha.earlyBrandBody", {
              niche: nicheLabel(t, data.niche),
            })}
          </p>
        </div>
        <div className={stepActions}>
          <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} w-full`}>
            {t("common.continue")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={stepScreen}>
      <Celebrate />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <BigNumber
          value={data.creators}
          label={t("onboarding.aha.creatorsAlready", {
            niche: nicheLabel(t, data.niche),
            creators: data.creators === 1 ? t("onboarding.aha.creatorIsAlready") : t("onboarding.aha.creatorsAreAlready"),
          })}
        />

        {data.sample.length > 0 && (
          <div className="animate-stagger-fade-in flex justify-center" style={{ animationDelay: "500ms" }}>
            <div className="flex -space-x-3">
              {data.sample.map((c) => (
                <span key={c.id} className="rounded-full border-2 border-background" title={c.displayName}>
                  <Avatar src={c.avatarUrl} name={c.displayName} size={52} />
                </span>
              ))}
            </div>
          </div>
        )}

        {data.established > 0 && (
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            {t("onboarding.aha.established", {
              count: data.established,
              verb: data.established === 1 ? t("onboarding.aha.has") : t("onboarding.aha.have"),
            })}
          </p>
        )}
      </div>

      <div className={stepActions}>
        <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} w-full`}>
          {t("common.continue")}
        </button>
      </div>
    </div>
  );
}
