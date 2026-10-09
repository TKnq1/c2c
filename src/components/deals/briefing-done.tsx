"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormValues } from "@/lib/compliance/briefing-form";
import { hapticSuccess } from "@/lib/haptics";
import { playSound } from "@/lib/sounds";
import { toast } from "@/lib/toast";
import { saveValuesAsTemplate, TEMPLATES_HREF } from "@/components/deals/briefing-template-panel";
import { cardClass, inputClass, primaryButton, secondaryButton } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";

// The moment after the briefing is saved: a check, a tick in the hand and the marimba of the onboarding's end, then what happens
// next and the reward for having done it: keep it as a template, and the next request starts from it. Short, and no confetti: this
// is business, the feeling comes from having finished.
export function BriefingDone({ requestId, values, hasTemplates, onEdit }: { requestId: string; values: FormValues; hasTemplates: boolean; onEdit: () => void }) {
  const u = useDealText();
  const router = useRouter();
  const [name, setName] = useState(u("briefing.done.templateName"));
  const [makeDefault, setMakeDefault] = useState(!hasTemplates);
  const [saved, setSaved] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    hapticSuccess();
    playSound("success");
  }, []);

  // Not a <form>: this sits inside the briefing's form, and a nested one would submit that one too.
  const keep = () =>
    startTransition(async () => {
      setProblem(null);
      const result = await saveValuesAsTemplate(values, name, makeDefault);
      if (!result.ok) {
        setProblem(result.issues[0]?.message ?? result.error ?? u("form.somethingWrong"));
        return;
      }
      toast.success(u("briefing.template.saved", { name: name.trim() }));
      setSaved(true);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4" role="status">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="animate-pop-in flex h-20 w-20 items-center justify-center rounded-full bg-ink text-4xl text-paper" aria-hidden>
          ✓
        </span>
        <h2 className="font-display text-title-2 font-bold">{u("briefing.done.title")}</h2>
        <p className="max-w-sm text-balance text-sm text-neutral-600 dark:text-neutral-400">{u("briefing.done.body")}</p>
      </div>

      <div className={`${cardClass} flex flex-col gap-3`}>
        <div>
          <p className="font-medium">{u("briefing.done.templateTitle")}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("briefing.done.templateBody")}</p>
        </div>
        {saved ? (
          <p className="text-sm font-medium">
            ✓ {u("briefing.template.saved", { name: name.trim() })}{" "}
            <Link href={TEMPLATES_HREF} className="font-normal underline">
              {u("briefing.template.manage")}
            </Link>
          </p>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                keep();
              }}
              maxLength={60}
              aria-label={u("briefing.template.name")}
              className={inputClass}
            />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="mt-0.5" />
              {u("briefing.template.makeDefault")}
            </label>
            {problem && (
              <p className="text-sm font-medium" role="alert">
                {problem}
              </p>
            )}
            <button type="button" onClick={keep} disabled={pending} className={`${secondaryButton} w-fit`}>
              {pending ? u("form.working") : u("briefing.done.templateAction")}
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/dashboard/startup/requests/${requestId}`} className={primaryButton}>
          {u("briefing.done.toRequest")}
        </Link>
        <button type="button" onClick={onEdit} className={secondaryButton}>
          {u("briefing.done.edit")}
        </button>
      </div>
    </div>
  );
}
