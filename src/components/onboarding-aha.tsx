"use client";

import { useEffect, useRef, useState } from "react";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { Confetti } from "@/components/confetti";
import { PRIMARY_BUTTON, useCountUp } from "@/components/onboarding-ui";
import {
  getBrandCreatorsAction,
  getCreatorMatchesAction,
  type BrandCreatorsResult,
  type CreatorMatchesResult,
} from "@/lib/actions/onboarding-flow";
import { PLATFORM_FEE_RATE } from "@/lib/constants";
import { hapticSuccess } from "@/lib/haptics";
import { plural } from "@/lib/onboarding-flow";

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
    <div className="flex flex-col items-center gap-5 py-16 text-center" role="status">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-splash.png" alt="" width={72} height={72} className="app-splash-logo dark:invert" />
      <p className="text-neutral-600 dark:text-neutral-400">{title}</p>
    </div>
  );
}

function Celebrate() {
  useEffect(() => {
    hapticSuccess();
  }, []);
  return <Confetti />;
}

function BigNumber({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value, 1100);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="font-display text-[4.5rem] leading-none font-black tabular-nums">{shown}</p>
      <p className="text-balance text-neutral-600 dark:text-neutral-400">{label}</p>
    </div>
  );
}

export function CreatorAha({ active, name, onNext }: { active: boolean; name: string; onNext: () => void }) {
  const { data, failed } = useAhaData<CreatorMatchesResult>(active, getCreatorMatchesAction);

  if (failed || (data && "error" in data)) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-neutral-600 dark:text-neutral-400">
          Your profile is saved. We couldn&apos;t load your matches just now, they&apos;ll be waiting in your feed.
        </p>
        <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
          Continue
        </button>
      </div>
    );
  }
  if (!data) return <Looking title="Finding requests that fit you…" />;

  const keep = Math.round((1 - PLATFORM_FEE_RATE) * 100);

  if (data.matches === 0) {
    return (
      <div className="animate-stagger-fade-in flex flex-col gap-6">
        <div>
          <h1 className="font-display text-title-1 font-bold text-balance">You&apos;re early, {name}</h1>
          <p className="mt-1.5 text-neutral-600 dark:text-neutral-400">
            {data.fitsReach > 0
              ? `Nothing in your niches yet, but ${data.fitsReach} open ${plural(data.fitsReach, "request")} elsewhere fit your reach. You'll find ${data.fitsReach === 1 ? "it" : "them"} under All in your feed.`
              : "No open requests fit your profile yet. The moment a brand posts one that does, it shows up in your feed."}
          </p>
        </div>
        <Trust keep={keep} />
        <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
          Show me how it works
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <Celebrate />
      <BigNumber
        value={data.matches}
        label={`open ${plural(data.matches, "request matches", "requests match")} you, ${name}`}
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
                {r.companyName} · {r.deal ?? r.niche}
              </span>
            </span>
            {r.budget && <span className="shrink-0 text-sm font-black">{r.budget}</span>}
          </li>
        ))}
      </ul>
      {data.matches > data.top.length && (
        <p className="-mt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
          and {data.matches - data.top.length} more in your feed
        </p>
      )}

      <Trust keep={keep} />
      <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
        Show me how it works
      </button>
    </div>
  );
}

function Trust({ keep }: { keep: number }) {
  return (
    <p className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
      <IoShieldCheckmarkOutline className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
      <span>
        Every budget is paid in before you post, and you keep at least {keep}% of what a brand pays.
      </span>
    </p>
  );
}

export function BrandAha({ active, onNext }: { active: boolean; onNext: () => void }) {
  const { data, failed } = useAhaData<BrandCreatorsResult>(active, getBrandCreatorsAction);

  if (failed || (data && "error" in data)) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-neutral-600 dark:text-neutral-400">
          Your profile is saved. Creators in your niche are waiting on Discover.
        </p>
        <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
          Continue
        </button>
      </div>
    );
  }
  if (!data) return <Looking title="Finding creators in your niche…" />;

  if (data.creators === 0) {
    return (
      <div className="animate-stagger-fade-in flex flex-col gap-6">
        <div>
          <h1 className="font-display text-title-1 font-bold text-balance">You&apos;re early</h1>
          <p className="mt-1.5 text-neutral-600 dark:text-neutral-400">
            No {data.niche} creators are here yet. Post your first request and the ones who match are notified the
            moment it goes live.
          </p>
        </div>
        <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <Celebrate />
      <BigNumber
        value={data.creators}
        label={`${data.niche} ${plural(data.creators, "creator is", "creators are")} already on comtor`}
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
          {data.established} of them {data.established === 1 ? "has" : "have"} 10K+ followers on a platform.
        </p>
      )}

      <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
        Continue
      </button>
    </div>
  );
}
