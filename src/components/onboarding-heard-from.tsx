"use client";

import { startTransition, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { saveHeardFromAction } from "@/lib/actions/onboarding";
import { HEARD_FROM, type HeardFrom } from "@/lib/heard-from";
import type { MessageKey } from "@/lib/i18n/translate";

const LABEL_KEYS: Record<HeardFrom, MessageKey> = {
  search: "onboarding.done.heardSearch",
  social: "onboarding.done.heardSocial",
  friend: "onboarding.done.heardFriend",
  community: "onboarding.done.heardCommunity",
  newsletter: "onboarding.done.heardNewsletter",
  event: "onboarding.done.heardEvent",
  other: "onboarding.done.heardOther",
};

// Optional, one tap, and nothing waits on it: the answer is saved in the background and ignoring the
// question costs nothing. Only the chosen code is stored (see src/lib/heard-from.ts).
export function OnboardingHeardFrom() {
  const { t } = useI18n();
  const [chosen, setChosen] = useState<HeardFrom | null>(null);

  function choose(answer: HeardFrom) {
    setChosen(answer);
    startTransition(() => {
      void saveHeardFromAction(answer);
    });
  }

  return (
    <section aria-labelledby="heard-from-title" className="flex flex-col gap-2.5">
      <h2 id="heard-from-title" className="text-sm font-semibold">
        {t("onboarding.done.heardTitle")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {HEARD_FROM.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={chosen === code}
            onClick={() => choose(code)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              chosen === code
                ? "border-ink bg-ink text-paper"
                : "border-neutral-300 text-neutral-700 hover:border-ink dark:border-neutral-700 dark:text-neutral-300"
            }`}
          >
            {t(LABEL_KEYS[code])}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="min-h-4 text-footnote text-neutral-500 dark:text-neutral-400">
        {chosen ? t("onboarding.done.heardThanks") : ""}
      </p>
    </section>
  );
}
