"use client";

import { useMemo, useState } from "react";
import { saveBriefingAction } from "@/lib/actions/briefing";
import { validateBriefing, MIN_LIVE_HOURS_OPTIONS } from "@/lib/compliance/briefing";
import { parseBriefingForm, type FormValues } from "@/lib/compliance/briefing-form";
import { MARKETS, MARKET_RULES, isMarket, type Market } from "@/lib/compliance/disclosure";
import { USAGE_CHANNEL_CODES, USAGE_CHANNELS } from "@/lib/compliance/usage-rights";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { issueMessage, dealLocale } from "@/lib/deals/copy";
import { POST_FORMATS, POST_FORMAT_CODES } from "@/lib/social/platforms";
import { DealForm } from "@/components/deals/deal-form";
import { useDealText } from "@/components/deals/use-deal-text";
import { Field, cardClass, inputClass } from "@/components/deals/ui";
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className={`${cardClass} flex flex-col gap-3`}>
      <legend className="sr-only">{title}</legend>
      <h2 className="font-medium">{title}</h2>
      {children}
    </fieldset>
  );
}

// The brand's campaign rules. Every field is checked as it is typed, with the same code the server runs on save, so a label
// that wouldn't be accepted, a window in the past or a usage fee without a channel shows up before the button is pressed.
export function BriefingBuilder({
  requestId,
  initialValues,
  budgetMaxCents,
}: {
  requestId: string;
  initialValues: FormValues;
  budgetMaxCents: number | null;
}) {
  const u = useDealText();
  const { locale } = useI18n();
  const language = dealLocale(locale);
  const [values, setValues] = useState<FormValues>(initialValues);

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

  const changeMarket = (next: string) => {
    const accepted = isMarket(next) ? MARKET_RULES[next].accepted : [];
    const kept = csv(values.disclosureLabels).filter((l) => accepted.includes(l));
    setValues((v) => ({ ...v, targetMarket: next, disclosureLabels: (kept.length > 0 ? kept : accepted.slice(0, 2)).join(",") }));
  };

  const usageChannels = USAGE_CHANNEL_CODES.filter((c) => USAGE_CHANNELS[c].type === usageType);

  return (
    <DealForm
      action={saveBriefingAction.bind(null, requestId)}
      successMessage={u("briefing.saved")}
      submitLabel={u("briefing.save")}
      className="flex flex-col gap-4"
      hideFindings
      augment={(fd) => {
        for (const [name, value] of Object.entries(values)) fd.set(name, value ?? "");
      }}
    >
      {(state) => (
        <>
          <Group title={u("briefing.section.content")}>
            <Field label={u("briefing.market")} hint={u("briefing.marketHint")}>
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
            </div>
            <Field label={u("briefing.hashtags")} hint={u("briefing.hashtagsHint")}>
              <input value={values.requiredHashtags ?? ""} onChange={(e) => set("requiredHashtags", e.target.value)} className={inputClass} />
            </Field>
            <Field label={u("briefing.mentions")} hint={u("briefing.mentionsHint")}>
              <input value={values.requiredMentions ?? ""} onChange={(e) => set("requiredMentions", e.target.value)} className={inputClass} />
            </Field>
          </Group>

          <Group title={u("briefing.section.disclosure")}>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{u("briefing.labels")}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.labelsHint")}</span>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
                {MARKET_RULES[market].accepted.map((label) => (
                  <Check key={label} checked={csv(values.disclosureLabels).includes(label)} onChange={(on) => toggle("disclosureLabels", label, on)} label={label} />
                ))}
              </div>
            </div>
            <Check
              checked={flag("requirePaidPartnershipLabel")}
              onChange={(on) => setFlag("requirePaidPartnershipLabel", on)}
              label={u("briefing.partnership")}
              hint={u("briefing.partnershipHint")}
            />
          </Group>

          <Group title={u("briefing.section.workflow")}>
            <Check checked={flag("draftRequired")} onChange={(on) => setFlag("draftRequired", on)} label={u("briefing.draftRequired")} />
            {flag("draftRequired") && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={u("briefing.draftLead")}>
                  <input type="number" min={1} max={30} value={values.draftDueDaysBeforePost ?? ""} onChange={(e) => set("draftDueDaysBeforePost", e.target.value)} className={inputClass} />
                </Field>
                <Field label={u("briefing.reviewDays")} hint={u("briefing.reviewDaysHint")}>
                  <input type="number" min={1} max={14} value={values.brandReviewDays ?? ""} onChange={(e) => set("brandReviewDays", e.target.value)} className={inputClass} />
                </Field>
                <Field label={u("briefing.revisions")}>
                  <input type="number" min={0} max={5} value={values.maxRevisionRounds ?? ""} onChange={(e) => set("maxRevisionRounds", e.target.value)} className={inputClass} />
                </Field>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={u("briefing.windowStart")}>
                <input type="date" value={values.postingWindowStart ?? ""} onChange={(e) => set("postingWindowStart", e.target.value)} className={inputClass} />
              </Field>
              <Field label={u("briefing.windowEnd")} hint={u("briefing.windowHint")}>
                <input type="date" value={values.postingWindowEnd ?? ""} onChange={(e) => set("postingWindowEnd", e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label={u("briefing.minLive")} hint={u("briefing.minLiveHint")}>
              <select value={values.minLiveHours ?? "24"} onChange={(e) => set("minLiveHours", e.target.value)} className={inputClass}>
                {MIN_LIVE_HOURS_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {u(`briefing.live.${h}`)}
                  </option>
                ))}
              </select>
            </Field>
          </Group>

          <Group title={u("briefing.section.exclusivity")}>
            <Check checked={flag("exclusivityEnabled")} onChange={(on) => setFlag("exclusivityEnabled", on)} label={u("briefing.exclusivity")} hint={u("briefing.exclusivityHint")} />
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
                </div>
                <Field label={u("briefing.competitors")} hint={u("briefing.competitorsHint")}>
                  <textarea rows={2} value={values.exclusivityCompetitors ?? ""} onChange={(e) => set("exclusivityCompetitors", e.target.value)} className={inputClass} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={u("briefing.daysBefore")}>
                    <input type="number" min={0} max={365} value={values.exclusivityDaysBefore ?? ""} onChange={(e) => set("exclusivityDaysBefore", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={u("briefing.daysAfter")}>
                    <input type="number" min={0} max={365} value={values.exclusivityDaysAfter ?? ""} onChange={(e) => set("exclusivityDaysAfter", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </>
            )}
          </Group>

          <Group title={u("briefing.section.usage")}>
            <Field label={u("briefing.usageType")}>
              <select
                value={usageType}
                onChange={(e) => setValues((v) => ({ ...v, usageType: e.target.value, usageChannels: "" }))}
                className={inputClass}
              >
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
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={u("briefing.usageDuration")}>
                    <input type="number" min={1} max={730} value={values.usageDurationDays ?? ""} onChange={(e) => set("usageDurationDays", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={u("briefing.usageFee")} hint={u("briefing.usageFeeHint")}>
                    <input inputMode="decimal" value={values.usageFeeEuros ?? ""} onChange={(e) => set("usageFeeEuros", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={u("briefing.territory")}>
                    <input value={values.usageTerritory ?? "EU"} onChange={(e) => set("usageTerritory", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </>
            )}
          </Group>

          <Group title={u("briefing.section.notes")}>
            <Field label={u("briefing.talkingPoints")}>
              <textarea rows={3} maxLength={2000} value={values.talkingPoints ?? ""} onChange={(e) => set("talkingPoints", e.target.value)} className={inputClass} />
            </Field>
            <Field label={u("briefing.doNots")}>
              <textarea rows={3} maxLength={2000} value={values.doNots ?? ""} onChange={(e) => set("doNots", e.target.value)} className={inputClass} />
            </Field>
          </Group>

          <div className={`${cardClass} flex flex-col gap-2 text-sm`} aria-live="polite">
            {errors.length > 0 ? (
              <>
                <p className="font-medium">{u("briefing.problems")}</p>
                <ul className="flex flex-col gap-1">
                  {errors.map((i) => (
                    <li key={i.code + JSON.stringify(i.params)}>✕ {issueMessage(i, language)}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-medium">{u("briefing.fine")}</p>
            )}
            {warnings.length > 0 && (
              <>
                <p className="mt-1 font-medium">{u("briefing.warnings")}</p>
                <ul className="flex flex-col gap-1 text-neutral-600 dark:text-neutral-400">
                  {warnings.map((i) => (
                    <li key={i.code + JSON.stringify(i.params)}>! {issueMessage(i, language)}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.frozen")}</p>
            {state?.error && !state.issues?.length && <p className="font-medium">{state.error}</p>}
          </div>
        </>
      )}
    </DealForm>
  );
}
