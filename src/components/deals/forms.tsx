"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IoCheckmarkCircle, IoCopyOutline, IoEllipseOutline, IoEllipsisHorizontal, IoImageOutline } from "react-icons/io5";
import { cancelDealAction, confirmPostAction, confirmUsageAction, deliverUsageAction, openDisputeAction, recheckPostsAction, reviewDraftAction, schedulePostAction, signContractAction, submitDealPostAction, submitDraftAction } from "@/lib/actions/deals";
import { resizeImageFile } from "@/lib/resize-image";
import { validatePostDisclosure, type Market } from "@/lib/compliance/disclosure";
import { captionTemplate, postChecklist, type ChecklistItem } from "@/lib/compliance/post-checklist";
import { toast } from "@/lib/toast";
import { POST_FORMATS, isPostFormat, type PostFormat } from "@/lib/social/platforms";
import { detectFormat, parsePostUrl } from "@/lib/social/url";
import { issueMessage } from "@/lib/deals/copy";
import type { DisputeReason } from "@prisma/client";
import { Dialog } from "@/components/dialog";
import { DealActionButton, DealForm } from "@/components/deals/deal-form";
import { useDealText } from "@/components/deals/use-deal-text";
import { Field, inputClass, quietButton, secondaryButton } from "@/components/deals/ui";
import { useI18n } from "@/components/i18n-provider";
import { dealLocale } from "@/lib/deals/copy";

// ---------------------------------------------------------------------------------------------------------------------
// One-tap actions
// ---------------------------------------------------------------------------------------------------------------------

export function SignContractButton({ dealId, termsHash }: { dealId: string; termsHash: string }) {
  const u = useDealText();
  return <DealActionButton action={() => signContractAction(dealId, termsHash)} label={u("contract.sign")} successMessage={u("contract.signed")} />;
}

// Both sides signed but the contract could not move on: signing again just retries the step that failed.
export function ContinueContractButton({ dealId, termsHash }: { dealId: string; termsHash: string }) {
  const u = useDealText();
  return <DealActionButton action={() => signContractAction(dealId, termsHash)} label={u("contract.continue")} successMessage={u("contract.signed")} />;
}

export function CancelDealButton({ dealId, funded, className }: { dealId: string; funded: boolean; className?: string }) {
  const u = useDealText();
  return (
    <DealActionButton
      variant="secondary"
      className={className}
      action={() => cancelDealAction(dealId)}
      label={u("deal.cancel")}
      successMessage={u("deal.cancelled")}
      confirmMessage={funded ? u("deal.cancelConfirmRefund") : u("deal.cancelConfirm")}
    />
  );
}

export function ConfirmPostButton({ postId }: { postId: string }) {
  const u = useDealText();
  return <DealActionButton action={() => confirmPostAction(postId)} label={u("posts.confirm")} successMessage={u("posts.confirmed")} />;
}

export function RecheckButton({ dealId }: { dealId: string }) {
  const u = useDealText();
  return <DealActionButton variant="secondary" action={() => recheckPostsAction(dealId)} label={u("posts.recheck")} successMessage={u("posts.rechecked")} />;
}

export function ConfirmUsageButton({ dealId }: { dealId: string }) {
  const u = useDealText();
  return <DealActionButton variant="secondary" action={() => confirmUsageAction(dealId)} label={u("usage.confirm")} successMessage={u("usage.confirmed")} />;
}

// ---------------------------------------------------------------------------------------------------------------------
// Checklist and proof, shared by the draft and the post form
// ---------------------------------------------------------------------------------------------------------------------

export type CaptionTerms = {
  market: Market;
  labels: string[];
  requirePaidPartnershipLabel: boolean;
  requiredHashtags: string[];
  requiredMentions: string[];
};

// What the post has to carry, as ticks that follow what is typed, with a button to copy the hashtags and mentions and to start the
// caption from a template. The check behind it is the one the server runs.
function CaptionChecklist({ items, template, onInsertTemplate }: { items: ChecklistItem[]; template?: string; onInsertTemplate?: () => void }) {
  const u = useDealText();
  if (items.length === 0) return null;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(u("check.copied"));
    } catch {
      toast.error(u("form.somethingWrong"));
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded border border-neutral-200 p-3 dark:border-neutral-700" aria-live="polite">
      <p className="text-sm font-medium">{u("check.title")}</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            {item.done ? <IoCheckmarkCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> : <IoEllipseOutline className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" aria-hidden />}
            <span className="min-w-0 flex-1 break-words">
              <span className="sr-only">{item.done ? u("check.done") : u("check.open")}: </span>
              {item.id === "label" && u("check.label", { labels: item.detail, chars: item.chars ?? 0 })}
              {item.id === "hashtags" && u("check.hashtags", { detail: item.detail })}
              {item.id === "mentions" && u("check.mentions", { detail: item.detail })}
              {item.id === "content" && u("check.content")}
              {item.id === "partnership" && u("check.partnership", { detail: item.detail })}
            </span>
            {item.copy && (item.id === "hashtags" || item.id === "mentions") && (
              <button type="button" onClick={() => copy(item.copy!)} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-300 px-2.5 py-1 text-xs font-medium dark:border-neutral-700">
                <IoCopyOutline className="h-3.5 w-3.5" aria-hidden />
                {u("check.copy")}
              </button>
            )}
          </li>
        ))}
      </ul>
      {template && onInsertTemplate && (
        <button type="button" onClick={onInsertTemplate} className="w-fit text-sm underline">
          {u("check.template")}
        </button>
      )}
    </div>
  );
}

// The screenshot of a story or a post that cannot be checked by link: a large button, then a preview with a way to swap or drop it.
// The image is made smaller in the browser before it is sent, and the preview shows exactly what is sent.
function ProofPicker({ proof, onChange, error, onError, label }: { proof: { blob: Blob } | null; onChange: (value: { blob: Blob; name: string } | null) => void; error: string | null; onError: (message: string | null) => void; label: string }) {
  const u = useDealText();
  // The address of the preview belongs to the blob it was made for; it is let go of when the blob is replaced, removed or the
  // form closes.
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const current = useRef<string | null>(null);
  const show = (next: { blob: Blob; name: string } | null) => {
    if (current.current) URL.revokeObjectURL(current.current);
    current.current = next ? URL.createObjectURL(next.blob) : null;
    setPreview(next && current.current ? { blob: next.blob, url: current.current } : null);
    onChange(next);
  };
  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );
  const previewUrl = proof && preview?.blob === proof.blob ? preview.url : null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-neutral-400 px-4 py-3 text-sm font-medium transition hover:border-ink focus-within:ring-2 focus-within:ring-ink dark:border-neutral-600">
        <IoImageOutline className="h-5 w-5" aria-hidden />
        {proof ? u("proof.change") : u("proof.choose")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            onError(null);
            if (!file) return show(null);
            try {
              const { blob } = await resizeImageFile(file, { maxDimension: 1600, quality: 0.85 });
              show({ blob, name: "proof.jpg" });
            } catch {
              show(null);
              onError(u("posts.proofUnreadable"));
            }
            e.target.value = "";
          }}
        />
      </label>
      {previewUrl && (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={u("proof.preview")} className="h-28 w-auto max-w-[60%] rounded border border-neutral-200 object-cover dark:border-neutral-700" />
          <button type="button" onClick={() => show(null)} className={quietButton}>
            {u("proof.remove")}
          </button>
        </div>
      )}
      {error && <span className="text-xs font-medium text-ink">{error}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------------------------------------------------

export function SubmitDraftForm({ dealId, revising, terms, formats }: { dealId: string; revising: boolean; terms: CaptionTerms; formats: string[] }) {
  const u = useDealText();
  const [caption, setCaption] = useState("");
  // The caption is judged by the rules of the first format that has one (a story has none), as on the server.
  const captionFormat = formats.filter(isPostFormat).find((f) => POST_FORMATS[f].kind !== "story");
  const items = useMemo(
    () =>
      captionFormat
        ? postChecklist(
            {
              format: captionFormat,
              market: terms.market,
              caption,
              disclosureInContent: false,
              paidPartnershipLabel: true,
              agreed: { labels: terms.labels, requirePaidPartnershipLabel: false, requiredHashtags: terms.requiredHashtags, requiredMentions: terms.requiredMentions },
            },
            { content: false, partnership: false },
          )
        : [],
    [captionFormat, caption, terms],
  );
  const template = captionTemplate({ labels: terms.labels, requirePaidPartnershipLabel: false, requiredHashtags: terms.requiredHashtags, requiredMentions: terms.requiredMentions });

  return (
    <DealForm
      action={submitDraftAction.bind(null, dealId)}
      successMessage={u("drafts.submitted")}
      submitLabel={revising ? u("drafts.resubmit") : u("drafts.submit")}
      resetOnSuccess
      onDone={() => setCaption("")}
    >
      {(state) => (
        <>
          <Field label={u("drafts.kind")}>
            <select name="kind" defaultValue="VIDEO_PREVIEW" className={inputClass}>
              <option value="SCRIPT">{u("drafts.kind.SCRIPT")}</option>
              <option value="VIDEO_PREVIEW">{u("drafts.kind.VIDEO_PREVIEW")}</option>
              <option value="IMAGE">{u("drafts.kind.IMAGE")}</option>
              <option value="OTHER">{u("drafts.kind.OTHER")}</option>
            </select>
          </Field>
          <Field label={u("drafts.link")} hint={u("drafts.linkHint")} name="url" issues={state?.issues}>
            <input name="url" type="url" inputMode="url" placeholder="https://…" className={inputClass} />
          </Field>
          <Field label={u("drafts.notes")}>
            <textarea name="notes" rows={3} maxLength={2000} className={inputClass} />
          </Field>
          <CaptionChecklist items={items} template={template} onInsertTemplate={() => setCaption((current) => (current.trim() === "" ? template : current))} />
          <Field label={u("drafts.caption")} hint={u("drafts.captionHint")} name="caption" issues={state?.issues}>
            <textarea name="caption" rows={4} maxLength={2200} value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="disclosureConfirmed" value="true" className="mt-0.5" />
            <span>{u("drafts.disclosureInContent")}</span>
          </label>
        </>
      )}
    </DealForm>
  );
}

export function ReviewDraftForm({ dealId, canRequestChanges, roundsLeft }: { dealId: string; canRequestChanges: boolean; roundsLeft: number }) {
  const u = useDealText();
  return (
    <DealForm action={reviewDraftAction.bind(null, dealId)} successMessage={u("drafts.reviewed")} submitLabel="" hideSubmit>
      {(_state, pending) => (
        <>
          <Field label={u("drafts.feedback")} hint={canRequestChanges ? u("drafts.roundsLeft", { count: roundsLeft }) : u("drafts.noRoundsLeft")}>
            <textarea name="feedback" rows={3} maxLength={1000} className={inputClass} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="decision" value="APPROVE" disabled={pending} className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50">
              {u("drafts.approve")}
            </button>
            {canRequestChanges && (
              <button type="submit" name="decision" value="CHANGES" disabled={pending} className={secondaryButton}>
                {u("drafts.requestChanges")}
              </button>
            )}
            <button type="submit" name="decision" value="REJECT" disabled={pending} className={quietButton}>
              {u("drafts.reject")}
            </button>
          </div>
        </>
      )}
    </DealForm>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Scheduling and posting
// ---------------------------------------------------------------------------------------------------------------------

// A date, a time and a few quick picks, submitted as one absolute time: the browser's wall clock turned into ISO, so the server never
// has to guess the person's time zone. Two fields instead of one datetime-local, which every browser shows in its own order and
// takes a long time to fill on a phone.
type QuickPick = { key: "form.quick.now" | "form.quick.yesterday" | "form.quick.tomorrow" | "form.quick.in3" | "form.quick.in7"; days: number; at?: string };
const FUTURE_PICKS: QuickPick[] = [
  { key: "form.quick.tomorrow", days: 1, at: "10:00" },
  { key: "form.quick.in3", days: 3, at: "10:00" },
  { key: "form.quick.in7", days: 7, at: "10:00" },
];
const PAST_PICKS: QuickPick[] = [
  { key: "form.quick.now", days: 0 },
  { key: "form.quick.yesterday", days: -1 },
];

function LocalDateTime({ name, defaultNow = false, future = false }: { name: string; defaultNow?: boolean; future?: boolean }) {
  const u = useDealText();
  const [date, setDate] = useState(() => (defaultNow ? toLocalInput(new Date()).slice(0, 10) : ""));
  const [time, setTime] = useState(() => (defaultNow ? toLocalInput(new Date()).slice(11, 16) : ""));
  const iso = date && time ? new Date(`${date}T${time}`).toISOString() : "";
  const now = toLocalInput(new Date());
  const picks = future ? FUTURE_PICKS : PAST_PICKS;

  function pick(p: QuickPick) {
    const day = new Date();
    day.setDate(day.getDate() + p.days);
    const stamp = toLocalInput(day);
    setDate(stamp.slice(0, 10));
    // "Now" and "yesterday" keep the clock; the future picks start at a sensible hour unless one was typed already.
    setTime(p.at ? time || p.at : stamp.slice(11, 16));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_8rem] gap-2">
        <input type="date" value={date} min={future ? now.slice(0, 10) : undefined} onChange={(e) => setDate(e.target.value)} className={inputClass} required={!defaultNow} aria-label={u("form.date")} />
        <input
          type="time"
          value={time}
          min={future && date === now.slice(0, 10) ? now.slice(11, 16) : undefined}
          onChange={(e) => setTime(e.target.value)}
          className={inputClass}
          required={!defaultNow}
          aria-label={u("form.time")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {picks.map((p) => (
          <button key={p.key} type="button" onClick={() => pick(p)} className="min-h-9 rounded-full border border-neutral-300 px-3 text-sm transition hover:border-neutral-500 dark:border-neutral-700">
            {u(p.key)}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={iso} />
    </div>
  );
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduleForm({ dealId, rescheduling }: { dealId: string; rescheduling: boolean }) {
  const u = useDealText();
  return (
    <DealForm action={schedulePostAction.bind(null, dealId)} successMessage={u("posts.scheduled")} submitLabel={rescheduling ? u("posts.reschedule") : u("posts.schedule")}>
      {(state) => (
        <Field label={u("posts.scheduleAt")} name="scheduledFor" issues={state?.issues}>
          <LocalDateTime name="scheduledFor" future />
        </Field>
      )}
    </DealForm>
  );
}

export type PostFormTerms = {
  formats: string[];
  market: Market;
  labels: string[];
  requirePaidPartnershipLabel: boolean;
  requiredHashtags: string[];
  requiredMentions: string[];
  // Formats the platform cannot be asked about: a screenshot stands in for the check.
  proofFormats: string[];
  // Formats that already have a live (or being checked) post: the form starts on the next one still missing.
  reportedFormats: string[];
};

const LINK_PLACEHOLDER = {
  Instagram: "https://www.instagram.com/reel/…",
  TikTok: "https://www.tiktok.com/@you/video/…",
  YouTube: "https://www.youtube.com/watch?v=…",
} as const;

export function SubmitPostForm({ dealId, terms }: { dealId: string; terms: PostFormTerms }) {
  const u = useDealText();
  const { locale } = useI18n();
  const language = dealLocale(locale);
  const formats = terms.formats.filter(isPostFormat);
  const [format, setFormat] = useState<PostFormat>(formats.find((f) => !terms.reportedFormats.includes(f)) ?? formats[0] ?? "INSTAGRAM_REEL");
  const [caption, setCaption] = useState("");
  const [inContent, setInContent] = useState(false);
  const [partnership, setPartnership] = useState(false);
  const [proof, setProof] = useState<{ blob: Blob; name: string } | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const info = POST_FORMATS[format];
  // The booked formats the pasted link could be: the form picks the right one so the creator does not have to.
  const detected = link.trim() ? detectFormat(link, formats, format) : null;
  const linkParsed = link.trim() !== "" && parsePostUrl(link).ok;
  const needsProof = terms.proofFormats.includes(format);
  const linkOptional = info.verification === "proof";

  // The same check the server runs, as a hint while typing and as a checklist.
  const disclosureInput = useMemo(
    () => ({
      format,
      market: terms.market,
      caption,
      disclosureInContent: inContent,
      paidPartnershipLabel: partnership,
      agreed: { labels: terms.labels, requirePaidPartnershipLabel: terms.requirePaidPartnershipLabel, requiredHashtags: terms.requiredHashtags, requiredMentions: terms.requiredMentions },
    }),
    [format, caption, inContent, partnership, terms],
  );
  const hints = useMemo(() => validatePostDisclosure(disclosureInput).issues, [disclosureInput]);
  const items = useMemo(() => postChecklist(disclosureInput), [disclosureInput]);
  const template = captionTemplate(disclosureInput.agreed);

  return (
    <DealForm
      action={submitDealPostAction.bind(null, dealId)}
      successMessage={u("posts.submitted")}
      submitLabel={u("posts.submit")}
      augment={(fd) => {
        fd.delete("proof");
        if (proof) fd.set("proof", proof.blob, proof.name);
      }}
      onDone={() => {
        setCaption("");
        setInContent(false);
        setPartnership(false);
        setProof(null);
        setLink("");
      }}
    >
      {(state) => (
        <>
          <Field label={u("posts.format")}>
            <select name="format" value={format} onChange={(e) => setFormat(e.target.value as PostFormat)} className={inputClass}>
              {formats.map((f) => (
                <option key={f} value={f}>
                  {POST_FORMATS[f].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={linkOptional ? u("posts.linkOptional") : u("posts.link")} hint={u("posts.linkHint")} name="url" issues={state?.issues}>
            <input
              name="url"
              type="url"
              inputMode="url"
              required={!linkOptional}
              placeholder={LINK_PLACEHOLDER[info.platform]}
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                const next = detectFormat(e.target.value, formats, format);
                if (next && next !== format) setFormat(next);
              }}
              className={inputClass}
            />
            {detected && <span className="text-xs text-neutral-600 dark:text-neutral-400">✓ {u("posts.detected", { format: POST_FORMATS[detected].label })}</span>}
            {!detected && linkParsed && <span className="text-xs font-medium text-ink">! {u("posts.notBooked")}</span>}
          </Field>
          <CaptionChecklist items={items} template={info.kind !== "story" ? template : undefined} onInsertTemplate={() => setCaption((current) => (current.trim() === "" ? template : current))} />
          {info.kind !== "story" && (
            <Field label={u("posts.caption")} hint={u("posts.captionHint", { chars: info.visibleCaptionChars, labels: terms.labels.join(" / ") })} name="caption" issues={state?.issues}>
              <textarea name="caption" rows={4} maxLength={2200} value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} />
            </Field>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="disclosureInContent" value="true" checked={inContent} onChange={(e) => setInContent(e.target.checked)} className="mt-0.5" />
            <span>{info.kind === "story" ? u("posts.disclosureStory") : u("posts.disclosureInContent")}</span>
          </label>
          {info.partnershipLabel && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="paidPartnershipLabel" value="true" checked={partnership} onChange={(e) => setPartnership(e.target.checked)} className="mt-0.5" />
              <span>{u("posts.partnershipLabel", { label: info.partnershipLabel })}</span>
            </label>
          )}
          <Field label={u("posts.publishedAtField")}>
            <LocalDateTime name="publishedAt" defaultNow />
          </Field>
          <div data-issue-field="proof" className="flex flex-col gap-1">
            <ProofPicker proof={proof} onChange={setProof} error={proofError} onError={setProofError} label={needsProof ? u("posts.proofRequired") : u("posts.proofOptional")} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{u("posts.proofHint")}</span>
            {(state?.issues ?? [])
              .filter((i) => i.field === "proof")
              .map((i) => (
                <span key={i.code + i.message} className="text-xs font-medium text-ink">
                  {i.severity === "error" ? "✕ " : "! "}
                  {i.message}
                </span>
              ))}
          </div>
          {hints.length > 0 && (caption || inContent || partnership) && (
            <ul className="flex flex-col gap-0.5 text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
              {hints.map((i) => (
                <li key={i.code + JSON.stringify(i.params)}>
                  {i.severity === "error" ? "✕" : "!"} {issueMessage(i, language)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </DealForm>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Usage rights
// ---------------------------------------------------------------------------------------------------------------------

export function DeliverUsageForm({ dealId, channels }: { dealId: string; channels: string[] }) {
  const u = useDealText();
  const wantsCode = channels.includes("TIKTOK_SPARK_ADS");
  const wantsPermission = channels.some((c) => c === "META_PARTNERSHIP_ADS" || c === "WHITELISTING" || c === "YOUTUBE_PARTNERSHIP_ADS");
  return (
    <DealForm action={deliverUsageAction.bind(null, dealId)} successMessage={u("usage.delivered")} submitLabel={u("usage.deliver")}>
      {(state) => (
        <>
          {wantsCode && (
            <>
              <Field label={u("usage.sparkCode")} hint={u("usage.sparkCodeHint")} name="sparkAdsCode" issues={state?.issues}>
                <input name="sparkAdsCode" autoComplete="off" spellCheck={false} className={inputClass} />
              </Field>
              <Field label={u("usage.sparkExpires")} name="sparkAdsCodeExpiresAt" issues={state?.issues}>
                <input name="sparkAdsCodeExpiresAt" type="date" className={inputClass} />
              </Field>
            </>
          )}
          {wantsPermission && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="permissionConfirmed" value="true" className="mt-0.5" />
              <span>{u("usage.permission")}</span>
            </label>
          )}
        </>
      )}
    </DealForm>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------------------------------------------------

// A chargeback is never opened by a person: only the system does that, when Stripe tells it about one.
const REASONS: Exclude<DisputeReason, "CHARGEBACK">[] = ["MISSED_DEADLINE", "DRAFT_REJECTED", "POST_REMOVED", "DISCLOSURE_MISSING", "CONTENT_MISMATCH", "USAGE_RIGHTS_MISSING", "OTHER"];

function DisputeDialog({ dealId, open, onClose }: { dealId: string; open: boolean; onClose: () => void }) {
  const u = useDealText();
  return (
    <Dialog open={open} onClose={onClose} title={u("dispute.title")}>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("dispute.explain")}</p>
      <DealForm action={openDisputeAction.bind(null, dealId)} successMessage={u("dispute.opened")} submitLabel={u("dispute.submit")} onDone={onClose} className="mt-3 flex flex-col gap-3">
        {(state) => (
          <>
            <Field label={u("dispute.reason")}>
              <select name="reason" defaultValue="OTHER" className={inputClass}>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {u(`dispute.reason.${r}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={u("dispute.details")} hint={u("dispute.detailsHint")} name="details" issues={state?.issues}>
              <textarea name="details" rows={4} maxLength={1000} required className={inputClass} />
            </Field>
          </>
        )}
      </DealForm>
    </Dialog>
  );
}

const menuItem = "w-full rounded px-3 py-2.5 text-left text-sm transition hover:bg-neutral-200/60 disabled:opacity-50 dark:hover:bg-neutral-700/60";

// The rarely needed actions of a deal, out of the way: report a problem, cancel the deal. A menu button in the header, so the
// page itself is about the next step. The dispute form is a dialog that lives outside the menu, so closing the menu does not
// close it.
export function DealMenu({ dealId, canDispute, canCancel, funded }: { dealId: string; canDispute: boolean; canCancel: boolean; funded: boolean }) {
  const u = useDealText();
  const [open, setOpen] = useState(false);
  const [dispute, setDispute] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!canDispute && !canCancel) return null;
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={u("deal.menu")}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-fog hover:text-ink"
      >
        <IoEllipsisHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 flex w-60 flex-col rounded border border-ink/10 bg-background p-1.5 shadow-lg">
          {canDispute && (
            <button
              type="button"
              role="menuitem"
              className={menuItem}
              onClick={() => {
                setOpen(false);
                setDispute(true);
              }}
            >
              {u("dispute.open")}
            </button>
          )}
          {canCancel && <CancelDealButton dealId={dealId} funded={funded} className={menuItem} />}
        </div>
      )}
      <DisputeDialog dealId={dealId} open={dispute} onClose={() => setDispute(false)} />
    </div>
  );
}
