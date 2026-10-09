"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveBriefingAction } from "@/lib/actions/briefing";
import { discardBriefingDraftAction, saveBriefingDraftAction } from "@/lib/actions/briefing-templates";
import { validateBriefing, MIN_LIVE_HOURS_OPTIONS } from "@/lib/compliance/briefing";
import { parseBriefingForm, type FormValues } from "@/lib/compliance/briefing-form";
import { BRIEFING_STEPS, countByStep, firstError, type BriefingStep } from "@/lib/compliance/briefing-steps";
import { MARKETS, MARKET_RULES, isMarket, type Market } from "@/lib/compliance/disclosure";
import { USAGE_CHANNEL_CODES, USAGE_CHANNELS } from "@/lib/compliance/usage-rights";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { issueMessage, dealLocale } from "@/lib/deals/copy";
import type { FieldIssue } from "@/lib/deals/action-state";
import { POST_FORMATS, POST_FORMAT_CODES } from "@/lib/social/platforms";
import { toast } from "@/lib/toast";
import { BriefingTemplatePanel, type CopyOption, type TemplateOption } from "@/components/deals/briefing-template-panel";
import { DealForm } from "@/components/deals/deal-form";
import { ReconfirmOffers } from "@/components/deals/reconfirm-offers";
import { useDealText } from "@/components/deals/use-deal-text";
import { Field, cardClass, inputClass, primaryButton, secondaryButton } from "@/components/deals/ui";
import { useI18n } from "@/components/i18n-provider";

function csv(value: string | undefined): string[] {
  return (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

function Check({ checked, onChange, label, hint }: { checked: boolean; onChange: (checked: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
      <span>
        {label}
        {hint && <span className="block text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>}
      </span>
    </label>
  );
}

function Group({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <fieldset className={`${cardClass} flex flex-col gap-3`}>
      <legend className="sr-only">{title}</legend>
      <h2 className="font-medium">{title}</h2>
      {intro && <p className="-mt-1 text-xs text-neutral-500 dark:text-neutral-400">{intro}</p>}
      {children}
    </fieldset>
  );
}

// What the check says about a field that is not a plain input (a group of checkboxes), under that group.
function FieldNote({ issues, field }: { issues: FieldIssue[]; field: string }) {
  const mine = issues.filter((i) => i.field === field);
  if (mine.length === 0) return null;
  return (
    <ul data-issue-field={field} className="flex flex-col gap-0.5 text-xs">
      {mine.map((i) => (
        <li key={i.code + i.message} className="font-medium text-ink">
          {i.severity === "error" ? "✕ " : "! "}
          {i.message}
        </li>
      ))}
    </ul>
  );
}

type DraftState = "idle" | "pending" | "saving" | "saved" | "failed";

const DRAFT_DELAY_MS = 2000;

// The brand's campaign rules, in three steps. Every field is checked as it is typed, with the same code the server runs on save,
// so a label that wouldn't be accepted, a window in the past or a usage fee without a channel shows up before the button is
// pressed; the bar at the bottom says how many errors there are and goes to the first one. What is typed is also kept as a draft
// on its own, so a closed tab loses nothing.
export function BriefingBuilder({
  requestId,
  initialValues,
  budgetMaxCents,
  source,
  templateName,
  templates,
  copyable,
  staleOwnOffers,
}: {
  requestId: string;
  initialValues: FormValues;
  budgetMaxCents: number | null;
  source: "draft" | "briefing" | "template" | "defaults";
  templateName: string | null;
  templates: TemplateOption[];
  copyable: CopyOption[];
  staleOwnOffers: number;
}) {
  const u = useDealText();
  const { locale } = useI18n();
  const language = dealLocale(locale);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [step, setStep] = useState<BriefingStep>("content");
  const [draftState, setDraftState] = useState<DraftState>("idle");

  // What the saved briefing (or the starting point) looks like: a change against it is unsaved, and only that is kept as a draft.
  const baseline = useRef(JSON.stringify(initialValues));
  const lastDraft = useRef(source === "draft" ? "" : JSON.stringify(initialValues));
  const latest = useRef(values);
  useEffect(() => {
    latest.current = values;
  }, [values]);

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));
  const flag = (name: string) => values[name] === "true";
  const setFlag = (name: string, on: boolean) => set(name, String(on));
  const toggle = (name: string, item: string, on: boolean) => {
    const list = csv(values[name]);
    set(name, (on ? [...new Set([...list, item])] : list.filter((x) => x !== item)).join(","));
  };

  const market: Market = isMarket(values.targetMarket ?? "") ? (values.targetMarket as Market) : "DE";
  const usageType = values.usageType ?? "ORGANIC_ONLY";

  const findings = useMemo(() => validateBriefing(parseBriefingForm(values), { budgetMaxCents }), [values, budgetMaxCents]);
  const errors = findings.filter((i) => i.severity === "error");
  const warnings = findings.filter((i) => i.severity === "warning");
  const errorsByStep = countByStep(findings);
  const issues: FieldIssue[] = useMemo(() => findings.map((i) => ({ code: i.code, severity: i.severity, field: i.field, message: issueMessage(i, language) })), [findings, language]);

  const changeMarket = (next: string) => {
    const accepted = isMarket(next) ? MARKET_RULES[next].accepted : [];
    const kept = csv(values.disclosureLabels).filter((l) => accepted.includes(l));
    setValues((v) => ({ ...v, targetMarket: next, disclosureLabels: (kept.length > 0 ? kept : accepted.slice(0, 2)).join(",") }));
  };

  const usageChannels = USAGE_CHANNEL_CODES.filter((c) => USAGE_CHANNELS[c].type === usageType);

  // A template or an earlier request fills the form, except for the dates, which belong to this request.
  const fill = (next: FormValues, message: string) => {
    if (JSON.stringify(values) !== baseline.current && !window.confirm(u("briefing.template.replaceConfirm"))) return;
    setValues((v) => ({ ...v, ...next, postingWindowStart: v.postingWindowStart, postingWindowEnd: v.postingWindowEnd }));
    toast.success(message);
  };

  // The unfinished briefing is kept on the server a moment after the last keystroke.
  useEffect(() => {
    const now = JSON.stringify(values);
    if (now === lastDraft.current) return;
    setDraftState("pending");
    const timer = window.setTimeout(async () => {
      setDraftState("saving");
      const fd = new FormData();
      for (const [name, value] of Object.entries(values)) fd.set(name, value ?? "");
      const result = await saveBriefingDraftAction(requestId, undefined, fd).catch(() => undefined);
      if (result?.success) {
        lastDraft.current = now;
        setDraftState("saved");
      } else {
        setDraftState("failed");
      }
    }, DRAFT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [values, requestId]);

  const jumpToError = () => {
    const first = firstError(findings);
    if (!first) return;
    setStep(first.step);
    // After the step is on screen.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const target = first.field ? document.querySelector<HTMLElement>(`[data-issue-field="${first.field}"]`) : null;
        (target ?? document.getElementById(`briefing-step-${first.step}`))?.scrollIntoView({ block: "center", behavior: "smooth" });
        target?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
      }),
    );
  };

  const stepIndex = BRIEFING_STEPS.indexOf(step);
  const stepNav = (
    <div className="flex items-center justify-between gap-3">
      {stepIndex > 0 ? (
        <button type="button" onClick={() => setStep(BRIEFING_STEPS[stepIndex - 1])} className={secondaryButton}>
          {u("briefing.step.back")}
        </button>
      ) : (
        <span />
      )}
      {stepIndex < BRIEFING_STEPS.length - 1 && (
        <button type="button" onClick={() => setStep(BRIEFING_STEPS[stepIndex + 1])} className={primaryButton}>
          {u("briefing.step.next")}
        </button>
      )}
    </div>
  );

  // Findings that belong to no field the form shows; they stand on the first step.
  const loose = issues.filter((i) => !i.field);

  const draftText =
    draftState === "saving" || draftState === "pending"
      ? u("briefing.draft.saving")
      : draftState === "saved"
        ? u("briefing.draft.saved")
        : draftState === "failed"
          ? u("briefing.draft.failed")
          : null;

  return (
    <DealForm
      action={saveBriefingAction.bind(null, requestId)}
      successMessage={u("briefing.saved")}
      submitLabel={u("briefing.save")}
      className="flex flex-col gap-4"
      hideFindings
      hideSubmit
      augment={(fd) => {
        for (const [name, value] of Object.entries(values)) fd.set(name, value ?? "");
      }}
      onDone={() => {
        // Saved: this is the new starting point, and the draft is gone with it (the server drops it).
        baseline.current = JSON.stringify(latest.current);
        lastDraft.current = baseline.current;
        setDraftState("idle");
      }}
    >
      {(state, pending) => (
        <>
          {source === "draft" && (
            <div className={`${cardClass} flex flex-col gap-3 text-sm`}>
              <p>{u("briefing.draft.banner")}</p>
              <button
                type="button"
                className={`${secondaryButton} w-fit`}
                onClick={async () => {
                  if (!window.confirm(u("briefing.draft.discardConfirm"))) return;
                  await discardBriefingDraftAction(requestId).catch(() => undefined);
                  window.location.reload();
                }}
              >
                {u("briefing.draft.discard")}
              </button>
            </div>
          )}
          {source === "template" && templateName && <p className="px-1 text-sm text-neutral-600 dark:text-neutral-400">{u("briefing.template.startedWith", { name: templateName })}</p>}
          <ReconfirmOffers requestId={requestId} count={staleOwnOffers} />

          <BriefingTemplatePanel values={values} templates={templates} copyable={copyable} startOpen={source === "defaults" || source === "template"} onFill={fill} />

          <div role="tablist" aria-label={u("briefing.steps")} className="grid grid-cols-[1fr_1.7fr_1fr] gap-1 rounded bg-fog p-1">
            {BRIEFING_STEPS.map((id, i) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`briefing-tab-${id}`}
                aria-selected={step === id}
                aria-controls={`briefing-step-${id}`}
                onClick={() => setStep(id)}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-center text-sm font-medium leading-tight transition-colors ${
                  step === id ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100" : "text-neutral-500 hover:text-ink dark:text-neutral-400"
                }`}
              >
                <span className="tabular-nums">{i + 1}</span>
                <span>{u(`briefing.step.${id}`)}</span>
                {errorsByStep[id] > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">{errorsByStep[id]}</span>}
              </button>
            ))}
          </div>

          <div id="briefing-step-content" role="tabpanel" aria-labelledby="briefing-tab-content" hidden={step !== "content"} className="flex flex-col gap-4">
            {loose.length > 0 && (
              <ul className={`${cardClass} flex flex-col gap-1 text-sm`}>
                {loose.map((i) => (
                  <li key={i.code + i.message}>
                    {i.severity === "error" ? "✕ " : "! "}
                    {i.message}
                  </li>
                ))}
              </ul>
            )}
            <Group title={u("briefing.section.content")}>
              <Field label={u("briefing.market")} hint={u("briefing.marketHint")} name="targetMarket" issues={issues}>
                <select value={market} onChange={(e) => changeMarket(e.target.value)} className={inputClass}>
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>
                      {u(`briefing.market.${m}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{u("briefing.formats")}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.formatsHint")}</span>
                <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
                  {POST_FORMAT_CODES.map((f) => (
                    <Check key={f} checked={csv(values.contentFormats).includes(f)} onChange={(on) => toggle("contentFormats", f, on)} label={POST_FORMATS[f].label} />
                  ))}
                </div>
                <FieldNote issues={issues} field="contentFormats" />
              </div>
              <Field label={u("briefing.hashtags")} hint={u("briefing.hashtagsHint")} name="requiredHashtags" issues={issues}>
                <input value={values.requiredHashtags ?? ""} onChange={(e) => set("requiredHashtags", e.target.value)} className={inputClass} />
              </Field>
              <Field label={u("briefing.mentions")} hint={u("briefing.mentionsHint")} name="requiredMentions" issues={issues}>
                <input value={values.requiredMentions ?? ""} onChange={(e) => set("requiredMentions", e.target.value)} className={inputClass} />
              </Field>
            </Group>

            <Group title={u("briefing.section.notes")}>
              <Field label={u("briefing.talkingPoints")} name="talkingPoints" issues={issues}>
                <textarea rows={3} maxLength={2000} value={values.talkingPoints ?? ""} onChange={(e) => set("talkingPoints", e.target.value)} className={inputClass} />
              </Field>
              <Field label={u("briefing.doNots")} name="doNots" issues={issues}>
                <textarea rows={3} maxLength={2000} value={values.doNots ?? ""} onChange={(e) => set("doNots", e.target.value)} className={inputClass} />
              </Field>
            </Group>
            {stepNav}
          </div>

          <div id="briefing-step-rules" role="tabpanel" aria-labelledby="briefing-tab-rules" hidden={step !== "rules"} className="flex flex-col gap-4">
            <Group title={u("briefing.section.disclosure")}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{u("briefing.labels")}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.labelsHint")}</span>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
                  {MARKET_RULES[market].accepted.map((label) => (
                    <Check key={label} checked={csv(values.disclosureLabels).includes(label)} onChange={(on) => toggle("disclosureLabels", label, on)} label={label} />
                  ))}
                </div>
                <FieldNote issues={issues} field="disclosureLabels" />
              </div>
              <Check
                checked={flag("requirePaidPartnershipLabel")}
                onChange={(on) => setFlag("requirePaidPartnershipLabel", on)}
                label={u("briefing.partnership")}
                hint={u("briefing.partnershipHint")}
              />
              <FieldNote issues={issues} field="requirePaidPartnershipLabel" />
            </Group>

            <Group title={u("briefing.section.workflow")}>
              <Check checked={flag("draftRequired")} onChange={(on) => setFlag("draftRequired", on)} label={u("briefing.draftRequired")} />
              {flag("draftRequired") && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={u("briefing.draftLead")} name="draftDueDaysBeforePost" issues={issues}>
                    <input type="number" min={1} max={30} value={values.draftDueDaysBeforePost ?? ""} onChange={(e) => set("draftDueDaysBeforePost", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={u("briefing.reviewDays")} hint={u("briefing.reviewDaysHint")} name="brandReviewDays" issues={issues}>
                    <input type="number" min={1} max={14} value={values.brandReviewDays ?? ""} onChange={(e) => set("brandReviewDays", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={u("briefing.revisions")} name="maxRevisionRounds" issues={issues}>
                    <input type="number" min={0} max={5} value={values.maxRevisionRounds ?? ""} onChange={(e) => set("maxRevisionRounds", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={u("briefing.windowStart")} name="postingWindowStart" issues={issues}>
                  <input type="date" value={values.postingWindowStart ?? ""} onChange={(e) => set("postingWindowStart", e.target.value)} className={inputClass} />
                </Field>
                <Field label={u("briefing.windowEnd")} hint={u("briefing.windowHint")} name="postingWindowEnd" issues={issues}>
                  <input type="date" value={values.postingWindowEnd ?? ""} onChange={(e) => set("postingWindowEnd", e.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label={u("briefing.minLive")} hint={u("briefing.minLiveHint")} name="minLiveHours" issues={issues}>
                <select value={values.minLiveHours ?? "24"} onChange={(e) => set("minLiveHours", e.target.value)} className={inputClass}>
                  {MIN_LIVE_HOURS_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {u(`briefing.live.${h}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </Group>
            {stepNav}
          </div>

          <div id="briefing-step-rights" role="tabpanel" aria-labelledby="briefing-tab-rights" hidden={step !== "rights"} className="flex flex-col gap-4">
            <p className="px-1 text-sm text-neutral-600 dark:text-neutral-400">{u("briefing.rightsIntro")}</p>
            <Group title={u("briefing.section.exclusivity")}>
              <Check checked={flag("exclusivityEnabled")} onChange={(on) => setFlag("exclusivityEnabled", on)} label={u("briefing.exclusivity")} hint={u("briefing.exclusivityHint")} />
              <FieldNote issues={issues} field="exclusivityEnabled" />
              {flag("exclusivityEnabled") && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{u("briefing.categories")}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.categoriesHint")}</span>
                    <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
                      {PRODUCT_CATEGORIES.map((c) => (
                        <Check key={c} checked={csv(values.exclusivityCategories).includes(c)} onChange={(on) => toggle("exclusivityCategories", c, on)} label={c} />
                      ))}
                    </div>
                    <FieldNote issues={issues} field="exclusivityCategories" />
                  </div>
                  <Field label={u("briefing.competitors")} hint={u("briefing.competitorsHint")} name="exclusivityCompetitors" issues={issues}>
                    <textarea rows={2} value={values.exclusivityCompetitors ?? ""} onChange={(e) => set("exclusivityCompetitors", e.target.value)} className={inputClass} />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={u("briefing.daysBefore")} name="exclusivityDaysBefore" issues={issues}>
                      <input type="number" min={0} max={365} value={values.exclusivityDaysBefore ?? ""} onChange={(e) => set("exclusivityDaysBefore", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label={u("briefing.daysAfter")} name="exclusivityDaysAfter" issues={issues}>
                      <input type="number" min={0} max={365} value={values.exclusivityDaysAfter ?? ""} onChange={(e) => set("exclusivityDaysAfter", e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                </>
              )}
            </Group>

            <Group title={u("briefing.section.usage")}>
              <Field label={u("briefing.usageType")} name="usageType" issues={issues}>
                <select value={usageType} onChange={(e) => setValues((v) => ({ ...v, usageType: e.target.value, usageChannels: "" }))} className={inputClass}>
                  <option value="ORGANIC_ONLY">{u("briefing.usageType.ORGANIC_ONLY")}</option>
                  <option value="CROSS_POST">{u("briefing.usageType.CROSS_POST")}</option>
                  <option value="PAID_ADS">{u("briefing.usageType.PAID_ADS")}</option>
                </select>
              </Field>
              {usageType !== "ORGANIC_ONLY" && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{u("briefing.channels")}</span>
                    <div className="mt-1 flex flex-col gap-1.5">
                      {usageChannels.map((c) => (
                        <Check key={c} checked={csv(values.usageChannels).includes(c)} onChange={(on) => toggle("usageChannels", c, on)} label={u(`briefing.channel.${c}`)} />
                      ))}
                    </div>
                    <FieldNote issues={issues} field="usageChannels" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label={u("briefing.usageDuration")} name="usageDurationDays" issues={issues}>
                      <input type="number" min={1} max={730} value={values.usageDurationDays ?? ""} onChange={(e) => set("usageDurationDays", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label={u("briefing.usageFee")} hint={u("briefing.usageFeeHint")} name="usageFeeEuros" issues={issues}>
                      <input inputMode="decimal" value={values.usageFeeEuros ?? ""} onChange={(e) => set("usageFeeEuros", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label={u("briefing.territory")} name="usageTerritory" issues={issues}>
                      <input value={values.usageTerritory ?? "EU"} onChange={(e) => set("usageTerritory", e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                </>
              )}
            </Group>
            <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.frozen")}</p>
            {stepNav}
          </div>

          {/* On a phone it is fixed above the tab bar (a sticky bar would sit at the mercy of <main>'s padding), from md up it sticks to
              the foot of the window: the save button and the errors stay in reach however far the form is scrolled. */}
          <div aria-hidden className="h-20 md:hidden" />
          <div className="max-md:fixed max-md:inset-x-6 max-md:bottom-[calc(var(--bar-bottom)+3.5rem)] max-md:z-30 md:sticky md:bottom-4 md:z-10" aria-live="polite">
            <div className="flex items-center gap-3 rounded border border-ink/10 bg-background/95 p-3 shadow-lg backdrop-blur">
              <div className="min-w-0 flex-1 text-sm">
                {errors.length > 0 ? (
                  <button type="button" onClick={jumpToError} className="text-left font-medium">
                    ✕ {errors.length === 1 ? u("briefing.errorCount.one") : u("briefing.errorCount.many", { count: errors.length })}
                    <span className="block text-xs font-normal underline">{u("briefing.jumpToError")}</span>
                  </button>
                ) : (
                  <p className="font-medium">✓ {u("briefing.fine")}</p>
                )}
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {[warnings.length > 0 ? (warnings.length === 1 ? u("briefing.warningCount.one") : u("briefing.warningCount.many", { count: warnings.length })) : null, draftText]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {state?.error && !state.issues?.length && <p className="text-xs font-medium">{state.error}</p>}
              </div>
              <button type={errors.length > 0 ? "button" : "submit"} onClick={errors.length > 0 ? jumpToError : undefined} disabled={pending} className={`${primaryButton} shrink-0`}>
                {pending ? u("form.working") : u("briefing.save")}
              </button>
            </div>
          </div>
        </>
      )}
    </DealForm>
  );
}
